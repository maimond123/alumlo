-- Drop the old version of the function with different parameters
DROP FUNCTION IF EXISTS llm_integrated_chronological_search_chick_fil_a(jsonb, int, text);

CREATE OR REPLACE FUNCTION llm_integrated_chronological_search_chick_fil_a(
  -- LLM PIPELINE INPUTS
  chronological_filters jsonb DEFAULT '{}',  -- Output from translateWithoutClassificationContext
  
  -- ADDITIONAL SEARCH PARAMETERS
  limit_count int DEFAULT 20,
  organization_name text DEFAULT 'chick_fil_a'
)
RETURNS TABLE (
  -- Rich Profile Fields from the Standard Search Table
  id bigint,
  created_at timestamptz,
  profile_id bigint,
  is_new boolean,
  chick_fil_a_exit_year numeric,
  had_multiple_company_stints boolean,
  is_current_leader boolean,
  management_experience boolean,
  revenue_responsibility boolean,
  years_since_chick_fil_a numeric,
  has_startup_experience boolean,
  has_enterprise_experience boolean,
  technical_background boolean,
  sales_experience boolean,
  consulting_experience boolean,
  restaurant_operations_experience boolean,
  is_remote_worker boolean,
  total_positions_count integer,
  average_tenure_months numeric,
  stem_education boolean,
  business_education boolean,
  continued_education boolean,
  executive_education boolean,
  technical_certifications boolean,
  elite_education boolean,
  mentor_potential boolean,
  current_estimated_salary numeric,
  highest_career_salary numeric,
  pre_chick_fil_a_salary numeric,
  first_post_chick_fil_a_salary numeric,
  chick_fil_a_provided_salary_lift boolean,
  achieved_six_figure_post_chick_fil_a boolean,
  doubled_salary_post_chick_fil_a boolean,
  moved_to_leadership_post_chick_fil_a boolean,
  career_level_increase_post_chick_fil_a boolean,
  likely_job_seeking boolean,
  highest_degree_level text,
  current_company_size_category text,
  school_ranking_tier text,
  education_geography text,
  industry_transitions text,
  industry_expertise text[],
  name text,
  career_trajectory text,
  profile_url text,
  picture_url text,
  headline text,
  home_location text,
  post_company_current_company text,
  post_company_current_title text,
  post_company_current_industry text,
  post_company_current_location text,
  current_company text,
  current_title text,
  current_job_location text,
  career_stage text,
  functional_expertise text[],
  post_company_companies text[],
  post_company_titles text[],
  post_company_industries text[],
  post_company_locations text[],
  pre_company_companies text[],
  pre_company_titles text[],
  pre_company_industries text[],
  pre_company_locations text[],
  undergraduate_school text[],
  graduate_school text[],
  high_school text[],
  pre_company_education text[],
  during_company_education text[],
  post_company_education text[],
  current_job_level text,
  current_job_function text,
  major_category text,
  undergraduate_major text,
  graduate_specialization text,
  
  -- Calculated Chronological Fields
  career_timeline jsonb,
  education_timeline jsonb,
  comprehensive_analysis jsonb
) AS $$
DECLARE
  -- Dynamic table name based on organization
  career_events_table text := organization_name || '_alumni_career_events';
  education_events_table text := organization_name || '_alumni_education_events';
  standard_search_table text := organization_name || '_alumni_standard_search';
BEGIN
  RETURN QUERY
  EXECUTE format('
  WITH career_analysis AS (
    SELECT 
      ce.profile_id,
      
      -- Build career timeline JSON
      jsonb_object_agg(
        ce.start_year::text || ''_'' || ce.start_month::text,
        jsonb_build_object(
          ''company'', ce.company,
          ''title'', ce.title,
          ''industry'', ce.industry,
          ''job_level'', ce.job_level,
          ''location'', ce.location,
          ''start_year'', ce.start_year,
          ''start_month'', ce.start_month,
          ''end_year'', ce.end_year,
          ''end_month'', ce.end_month,
          ''is_current'', ce.is_current_position,
          ''company_size'', ce.company_size,
          ''management_responsibility'', ce.management_responsibility,
          ''is_leadership_role'', ce.is_leadership_role,
          ''sequence_number'', ce.sequence_number
        )
      ) as career_timeline,
      
      -- Calculate total experience
      SUM(
        CASE WHEN ce.end_year = 9999 THEN 
          (EXTRACT(YEAR FROM NOW()) - ce.start_year) * 12 + 
          (EXTRACT(MONTH FROM NOW()) - ce.start_month)
        ELSE 
          (ce.end_year - ce.start_year) * 12 + (ce.end_month - ce.start_month)
        END
      ) / 12.0 as total_years_experience,
      
      -- Industry experience calculation
      COALESCE(
        SUM(
          CASE WHEN (($1->>''industry_filter'') IS NULL OR ce.industry ILIKE ''%%'' || ($1->>''industry_filter'') || ''%%'') THEN
            CASE WHEN ce.end_year = 9999 THEN 
              (EXTRACT(YEAR FROM NOW()) - ce.start_year) * 12 + 
              (EXTRACT(MONTH FROM NOW()) - ce.start_month)
            ELSE 
              (ce.end_year - ce.start_year) * 12 + (ce.end_month - ce.start_month)
            END
          ELSE 0 END
        ) / 12.0, 0
      ) as years_in_target_industry,
      
      -- Geographic mobility check
      COUNT(DISTINCT ce.location) > 1 as has_geographic_mobility,
      
      -- Latest and earliest career dates for timeline analysis
      MAX(ce.end_year * 12 + ce.end_month) as latest_career_end_month,
      MIN(ce.start_year * 12 + ce.start_month) as earliest_career_start_month
      
    FROM %I ce
    WHERE 
      -- Apply career filters using JSON extraction
      (($1->>''company_filter'') IS NULL OR ce.company ILIKE ''%%'' || ($1->>''company_filter'') || ''%%'')
      AND (($1->>''industry_filter'') IS NULL OR ce.industry ILIKE ''%%'' || ($1->>''industry_filter'') || ''%%'')
      AND (($1->>''title_filter'') IS NULL OR ce.title ILIKE ''%%'' || ($1->>''title_filter'') || ''%%'')
      AND (($1->>''location_filter'') IS NULL OR ce.location ILIKE ''%%'' || ($1->>''location_filter'') || ''%%'')
    GROUP BY ce.profile_id
  ),
  
  education_analysis AS (
    SELECT 
      ee.profile_id,
      
      -- Build education timeline JSON
      jsonb_object_agg(
        ee.start_year::text || ''_'' || ee.start_month::text,
        jsonb_build_object(
          ''institution'', ee.institution,
          ''degree'', ee.degree_name,
          ''degree_level'', ee.degree_level,
          ''location'', ee.location,
          ''start_year'', ee.start_year,
          ''start_month'', ee.start_month,
          ''end_year'', ee.end_year,
          ''end_month'', ee.end_month,
          ''graduation_year'', ee.graduation_year,
          ''is_current'', ee.is_current,
          ''sequence_number'', ee.sequence_number
        )
      ) as education_timeline,
      
      -- Highest degree level analysis
      CASE 
        WHEN MAX(ee.degree_level) ILIKE ''%%PhD%%'' OR MAX(ee.degree_level) ILIKE ''%%Doctorate%%'' THEN ''Doctorate''
        WHEN MAX(ee.degree_level) ILIKE ''%%Master%%'' THEN ''Master''''s''
        WHEN MAX(ee.degree_level) ILIKE ''%%Bachelor%%'' THEN ''Bachelor''''s''
        WHEN MAX(ee.degree_level) ILIKE ''%%Associate%%'' THEN ''Associate''
        ELSE ''High School''
      END as highest_degree_level,
      
      -- Latest and earliest education dates for timeline analysis
      MAX(ee.end_year * 12 + ee.end_month) as latest_education_end_month,
      MIN(ee.start_year * 12 + ee.start_month) as earliest_education_start_month
      
    FROM %I ee
    WHERE 
      -- Apply school filter using JSON extraction
      (($1->>''school_filter'') IS NULL OR ee.institution ILIKE ''%%'' || ($1->>''school_filter'') || ''%%'')
    GROUP BY ee.profile_id
  ),
  
  cross_domain_analysis AS (
    SELECT 
      COALESCE(ca.profile_id, ea.profile_id) as profile_id,
      ca.career_timeline,
      ea.education_timeline,
      ca.total_years_experience,
      ca.years_in_target_industry,
      ea.highest_degree_level,
      ca.has_geographic_mobility,
      
      -- Timeline pattern analysis
      CASE 
        WHEN ea.latest_education_end_month IS NOT NULL AND ca.earliest_career_start_month IS NOT NULL THEN
          CASE 
            WHEN ea.latest_education_end_month <= ca.earliest_career_start_month THEN ''education_then_career''
            WHEN ca.latest_career_end_month <= ea.earliest_education_start_month THEN ''career_then_education''
            WHEN (ea.earliest_education_start_month <= ca.latest_career_end_month AND 
                  ca.earliest_career_start_month <= ea.latest_education_end_month) THEN ''concurrent''
            ELSE ''mixed''
          END
        ELSE ''insufficient_data''
      END as timeline_pattern,
      
      -- Calculate gap between education and career
      CASE 
        WHEN ea.latest_education_end_month IS NOT NULL AND ca.earliest_career_start_month IS NOT NULL THEN 
          ABS(ca.earliest_career_start_month - ea.latest_education_end_month)
        ELSE 0
      END as sequence_gap_months,
      
      -- Concurrent activities detection
      CASE 
        WHEN ea.earliest_education_start_month IS NOT NULL AND ca.latest_career_end_month IS NOT NULL AND
             ca.earliest_career_start_month IS NOT NULL AND ea.latest_education_end_month IS NOT NULL THEN
          (ea.earliest_education_start_month <= ca.latest_career_end_month AND 
           ca.earliest_career_start_month <= ea.latest_education_end_month)
        ELSE FALSE
      END as has_concurrent_activities
      
    FROM career_analysis ca
    FULL OUTER JOIN education_analysis ea ON ca.profile_id = ea.profile_id
    WHERE 
      -- STRICT FILTER ENFORCEMENT: All filters must be satisfied
      
      -- Experience filters
      ((($1->>''total_experience_years'')::numeric) IS NULL OR COALESCE(ca.total_years_experience, 0) >= (($1->>''total_experience_years'')::numeric))
      AND ((($1->>''min_years_in_industry'')::numeric) IS NULL OR COALESCE(ca.years_in_target_industry, 0) >= (($1->>''min_years_in_industry'')::numeric))
      AND ((($1->>''geographic_mobility'')::boolean) IS NULL OR (($1->>''geographic_mobility'')::boolean) = FALSE OR COALESCE(ca.has_geographic_mobility, FALSE) = (($1->>''geographic_mobility'')::boolean))
      AND ((($1->>''concurrent_activities'')::boolean) IS NULL OR (($1->>''concurrent_activities'')::boolean) = FALSE OR 
           CASE 
             WHEN ea.earliest_education_start_month IS NOT NULL AND ca.latest_career_end_month IS NOT NULL AND
                  ca.earliest_career_start_month IS NOT NULL AND ea.latest_education_end_month IS NOT NULL THEN
               (ea.earliest_education_start_month <= ca.latest_career_end_month AND 
                ca.earliest_career_start_month <= ea.latest_education_end_month) = (($1->>''concurrent_activities'')::boolean)
             ELSE (($1->>''concurrent_activities'')::boolean) = FALSE
           END)
      
      -- HARD SCHOOL FILTER ENFORCEMENT
      AND (($1->>''school_filter'') IS NULL OR 
           (ea.profile_id IS NOT NULL AND 
            EXISTS (SELECT 1 FROM %I ee2 WHERE ee2.profile_id = ea.profile_id 
                    AND ee2.institution ILIKE ''%%'' || ($1->>''school_filter'') || ''%%'')))
      
      -- HARD COMPANY FILTER ENFORCEMENT  
      AND (($1->>''company_filter'') IS NULL OR 
           (ca.profile_id IS NOT NULL AND
            EXISTS (SELECT 1 FROM %I ce2 WHERE ce2.profile_id = ca.profile_id
                    AND ce2.company ILIKE ''%%'' || ($1->>''company_filter'') || ''%%'')))
      
      -- HARD INDUSTRY FILTER ENFORCEMENT
      AND (($1->>''industry_filter'') IS NULL OR 
           (ca.profile_id IS NOT NULL AND
            EXISTS (SELECT 1 FROM %I ce3 WHERE ce3.profile_id = ca.profile_id
                    AND ce3.industry ILIKE ''%%'' || ($1->>''industry_filter'') || ''%%'')))
      
      -- HARD TITLE FILTER ENFORCEMENT
      AND (($1->>''title_filter'') IS NULL OR 
           (ca.profile_id IS NOT NULL AND
            EXISTS (SELECT 1 FROM %I ce4 WHERE ce4.profile_id = ca.profile_id
                    AND ce4.title ILIKE ''%%'' || ($1->>''title_filter'') || ''%%'')))
      
      -- HARD LOCATION FILTER ENFORCEMENT
      AND (($1->>''location_filter'') IS NULL OR 
           (ca.profile_id IS NOT NULL AND
            EXISTS (SELECT 1 FROM %I ce5 WHERE ce5.profile_id = ca.profile_id
                    AND ce5.location ILIKE ''%%'' || ($1->>''location_filter'') || ''%%'')))
  )
  
  SELECT 
    -- Select all columns from the standard search table to get the rich profile
    ss.*,
    
    -- Add the unique calculated fields from this chronological search
    COALESCE(cda.career_timeline, ''{}''::jsonb) as career_timeline,
    COALESCE(cda.education_timeline, ''{}''::jsonb) as education_timeline,
    
    -- Build a comprehensive analysis JSON object with calculated metrics
    jsonb_build_object(
      ''total_years_experience'', cda.total_years_experience,
      ''years_in_target_industry'', cda.years_in_target_industry,
      ''timeline_pattern'', cda.timeline_pattern,
      ''sequence_gap_months'', cda.sequence_gap_months,
      ''has_concurrent_activities'', cda.has_concurrent_activities,
      ''has_geographic_mobility'', cda.has_geographic_mobility,
      ''applied_filters'', $1
    ) as comprehensive_analysis
    
  FROM cross_domain_analysis cda
  -- Join with the standard search table to get the full rich profile data
  JOIN %I ss ON cda.profile_id = ss.profile_id
  
  ORDER BY cda.total_years_experience DESC NULLS LAST, cda.profile_id
  LIMIT $2
  ', 
  career_events_table, 
  education_events_table, 
  education_events_table,  -- ee2 for school filter
  career_events_table,     -- ce2 for company filter  
  career_events_table,     -- ce3 for industry filter
  career_events_table,     -- ce4 for title filter
  career_events_table,     -- ce5 for location filter
  standard_search_table    -- The rich profile table to join with
  ) 
  USING 
    chronological_filters,           -- $1 (JSON with all filters)
    limit_count;                     -- $2
    
END;
$$ LANGUAGE plpgsql;

-- Add documentation
COMMENT ON FUNCTION llm_integrated_chronological_search_chick_fil_a IS 'Performs a chronological search based on event tables, then joins with the standard search table to return a full, enriched profile for each match. All filters are hard requirements.'; 