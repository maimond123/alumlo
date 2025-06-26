-- Drop the old version of the function with different parameters
DROP FUNCTION IF EXISTS llm_integrated_chronological_search_chick_fil_a(jsonb, jsonb, int, text);

CREATE OR REPLACE FUNCTION llm_integrated_chronological_search_chick_fil_a(
  -- LLM PIPELINE INPUTS
  chronological_filters jsonb DEFAULT '{}',  -- Output from translateWithoutClassificationContext
  
  -- ADDITIONAL SEARCH PARAMETERS
  limit_count int DEFAULT 20,
  organization_name text DEFAULT 'chick_fil_a'
)
RETURNS TABLE (
  -- RICH PROFILE DATA (matching standard search)
  id bigint,
  profile_id bigint,
  name text,
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
  current_job_level text,
  current_job_function text,
  career_stage text,
  career_trajectory text,
  is_current_leader boolean,
  management_experience boolean,
  revenue_responsibility boolean,
  current_company_size_category text,
  has_startup_experience boolean,
  has_enterprise_experience boolean,
  technical_background boolean,
  sales_experience boolean,
  consulting_experience boolean,
  restaurant_operations_experience boolean,
  is_remote_worker boolean,
  highest_degree_level text,
  school_ranking_tier text,
  major_category text,
  undergraduate_major text,
  graduate_specialization text,
  stem_education boolean,
  business_education boolean,
  elite_education boolean,
  continued_education boolean,
  executive_education boolean,
  technical_certifications boolean,
  mentor_potential boolean,
  likely_job_seeking boolean,
  total_positions_count integer,
  average_tenure_months decimal,
  current_estimated_salary decimal,
  highest_career_salary decimal,
  pre_chick_fil_a_salary decimal,
  first_post_chick_fil_a_salary decimal,
  chick_fil_a_provided_salary_lift boolean,
  achieved_six_figure_post_chick_fil_a boolean,
  doubled_salary_post_chick_fil_a boolean,
  moved_to_leadership_post_chick_fil_a boolean,
  career_level_increase_post_chick_fil_a boolean,
  undergraduate_school text[],
  graduate_school text[],
  high_school text[],
  pre_company_education text[],
  during_company_education text[],
  post_company_education text[],
  -- PRE-COMPANY CAREER TRACKING (before Chick-fil-A)
  pre_company_companies text[],
  pre_company_titles text[],
  pre_company_industries text[],
  pre_company_locations text[],
  -- POST-COMPANY CAREER TRACKING (after Chick-fil-A)
  post_company_companies text[],
  post_company_titles text[],
  post_company_industries text[],
  post_company_locations text[],
  functional_expertise text[],
  industry_expertise text[],
  industry_transitions text[],
  education_geography text[],
  -- Additional fields that exist in the table
  chick_fil_a_exit_year integer,
  had_multiple_company_stints boolean,
  years_since_chick_fil_a integer,
  
  -- CHRONOLOGICAL-SPECIFIC DATA (preserved from original function)
  career_timeline jsonb,
  education_timeline jsonb,
  comprehensive_analysis jsonb,
  
  -- Career progression metrics (calculated from event tables)
  total_years_experience numeric,
  years_in_target_industry numeric,
  
  -- Cross-domain analysis
  timeline_pattern text,
  sequence_gap_months int,
  has_concurrent_activities boolean
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
      
      -- TIER 1 FILTERS: Leadership & Management
      BOOL_OR(ce.is_leadership_role) as has_leadership_experience,
      BOOL_OR(ce.management_responsibility) as has_management_responsibility,
      
      -- TIER 1 FILTERS: Company Relationship Flags  
      BOOL_OR(ce.is_pre_company_position) as has_pre_company_experience,
      BOOL_OR(ce.is_post_company_position) as has_post_company_experience,
      BOOL_OR(ce.is_target_company_position) as worked_at_target_company,
      BOOL_OR(ce.is_during_company_position) as worked_during_company,
      
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
      END as highest_degree_level_calculated,
      
      -- TIER 1 FILTERS: Education Relationship Flags
      BOOL_OR(ee.is_pre_company_education) as educated_before_company,
      BOOL_OR(ee.is_during_company_education) as educated_during_company, 
      BOOL_OR(ee.is_post_company_education) as educated_after_company,
      
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
      COALESCE(ea.highest_degree_level_calculated, '''') as highest_degree_level_calculated,
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
      END as has_concurrent_activities,
      
      -- TIER 1 FILTER FIELDS: Career & Leadership
      COALESCE(ca.has_leadership_experience, FALSE) as has_leadership_experience,
      COALESCE(ca.has_management_responsibility, FALSE) as has_management_responsibility,
      COALESCE(ca.has_pre_company_experience, FALSE) as has_pre_company_experience,
      COALESCE(ca.has_post_company_experience, FALSE) as has_post_company_experience,
      COALESCE(ca.worked_at_target_company, FALSE) as worked_at_target_company,
      COALESCE(ca.worked_during_company, FALSE) as worked_during_company,
      
      -- TIER 1 FILTER FIELDS: Education
      COALESCE(ea.educated_before_company, FALSE) as educated_before_company,
      COALESCE(ea.educated_during_company, FALSE) as educated_during_company,
      COALESCE(ea.educated_after_company, FALSE) as educated_after_company
      
    FROM career_analysis ca
    FULL OUTER JOIN education_analysis ea ON ca.profile_id = ea.profile_id
    WHERE 
      -- Experience filters
      ((($1->>''total_experience_years'')::numeric) IS NULL OR COALESCE(ca.total_years_experience, 0) >= (($1->>''total_experience_years'')::numeric))
      AND ((($1->>''min_years_in_industry'')::numeric) IS NULL OR COALESCE(ca.years_in_target_industry, 0) >= (($1->>''min_years_in_industry'')::numeric))
      AND ((($1->>''geographic_mobility'')::boolean) IS NULL OR COALESCE(ca.has_geographic_mobility, FALSE) = (($1->>''geographic_mobility'')::boolean))
      AND ((($1->>''concurrent_activities'')::boolean) IS NULL OR 
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
      
      -- HARD COMPANY SIZE FILTER ENFORCEMENT
      AND (($1->>''company_size_filter'') IS NULL OR 
           (ca.profile_id IS NOT NULL AND
            EXISTS (SELECT 1 FROM %I ce6 WHERE ce6.profile_id = ca.profile_id
                    AND ce6.company_size ILIKE ''%%'' || ($1->>''company_size_filter'') || ''%%'')))
      
      -- HARD DEGREE LEVEL FILTER ENFORCEMENT
      AND (($1->>''degree_level_filter'') IS NULL OR 
           (ea.profile_id IS NOT NULL AND
            COALESCE(ea.highest_degree_level_calculated, '''') ILIKE ''%%'' || ($1->>''degree_level_filter'') || ''%%''))
  )
  
  SELECT 
    -- RICH PROFILE DATA (from standard search table)
    ss.id,
    cda.profile_id,
    COALESCE(ss.name, ''Unknown'') as name,
    COALESCE(ss.profile_url, '''') as profile_url,
    COALESCE(ss.picture_url, '''') as picture_url,
    COALESCE(ss.headline, '''') as headline,
    COALESCE(ss.home_location, '''') as home_location,
    COALESCE(ss.post_company_current_company, '''') as post_company_current_company,
    COALESCE(ss.post_company_current_title, '''') as post_company_current_title,
    COALESCE(ss.post_company_current_industry, '''') as post_company_current_industry,
    COALESCE(ss.post_company_current_location, '''') as post_company_current_location,
    COALESCE(ss.current_company, '''') as current_company,
    COALESCE(ss.current_title, '''') as current_title,
    COALESCE(ss.current_job_location, '''') as current_job_location,
    COALESCE(ss.current_job_level, '''') as current_job_level,
    COALESCE(ss.current_job_function, '''') as current_job_function,
    COALESCE(ss.career_stage, '''') as career_stage,
    COALESCE(ss.career_trajectory, '''') as career_trajectory,
    COALESCE(ss.is_current_leader, FALSE) as is_current_leader,
    COALESCE(ss.management_experience, FALSE) as management_experience,
    COALESCE(ss.revenue_responsibility, FALSE) as revenue_responsibility,
    COALESCE(ss.current_company_size_category, '''') as current_company_size_category,
    COALESCE(ss.has_startup_experience, FALSE) as has_startup_experience,
    COALESCE(ss.has_enterprise_experience, FALSE) as has_enterprise_experience,
    COALESCE(ss.technical_background, FALSE) as technical_background,
    COALESCE(ss.sales_experience, FALSE) as sales_experience,
    COALESCE(ss.consulting_experience, FALSE) as consulting_experience,
    COALESCE(ss.restaurant_operations_experience, FALSE) as restaurant_operations_experience,
    COALESCE(ss.is_remote_worker, FALSE) as is_remote_worker,
    COALESCE(ss.highest_degree_level, cda.highest_degree_level_calculated, '''') as highest_degree_level,
    COALESCE(ss.school_ranking_tier, '''') as school_ranking_tier,
    COALESCE(ss.major_category, '''') as major_category,
    COALESCE(ss.undergraduate_major, '''') as undergraduate_major,
    COALESCE(ss.graduate_specialization, '''') as graduate_specialization,
    COALESCE(ss.stem_education, FALSE) as stem_education,
    COALESCE(ss.business_education, FALSE) as business_education,
    COALESCE(ss.elite_education, FALSE) as elite_education,
    COALESCE(ss.continued_education, FALSE) as continued_education,
    COALESCE(ss.executive_education, FALSE) as executive_education,
    COALESCE(ss.technical_certifications, FALSE) as technical_certifications,
    COALESCE(ss.mentor_potential, FALSE) as mentor_potential,
    COALESCE(ss.likely_job_seeking, FALSE) as likely_job_seeking,
    COALESCE(ss.total_positions_count, 0) as total_positions_count,
    COALESCE(ss.average_tenure_months, 0) as average_tenure_months,
    COALESCE(ss.current_estimated_salary, 0) as current_estimated_salary,
    COALESCE(ss.highest_career_salary, 0) as highest_career_salary,
    COALESCE(ss.pre_chick_fil_a_salary, 0) as pre_chick_fil_a_salary,
    COALESCE(ss.first_post_chick_fil_a_salary, 0) as first_post_chick_fil_a_salary,
    COALESCE(ss.chick_fil_a_provided_salary_lift, FALSE) as chick_fil_a_provided_salary_lift,
    COALESCE(ss.achieved_six_figure_post_chick_fil_a, FALSE) as achieved_six_figure_post_chick_fil_a,
    COALESCE(ss.doubled_salary_post_chick_fil_a, FALSE) as doubled_salary_post_chick_fil_a,
    COALESCE(ss.moved_to_leadership_post_chick_fil_a, FALSE) as moved_to_leadership_post_chick_fil_a,
    COALESCE(ss.career_level_increase_post_chick_fil_a, FALSE) as career_level_increase_post_chick_fil_a,
    COALESCE(ss.undergraduate_school, ARRAY[]::TEXT[]) as undergraduate_school,
    COALESCE(ss.graduate_school, ARRAY[]::TEXT[]) as graduate_school,
    COALESCE(ss.high_school, ARRAY[]::TEXT[]) as high_school,
    COALESCE(ss.pre_company_education, ARRAY[]::TEXT[]) as pre_company_education,
    COALESCE(ss.during_company_education, ARRAY[]::TEXT[]) as during_company_education,
    COALESCE(ss.post_company_education, ARRAY[]::TEXT[]) as post_company_education,
    -- PRE-COMPANY CAREER FIELDS
    COALESCE(ss.pre_company_companies, ARRAY[]::TEXT[]) as pre_company_companies,
    COALESCE(ss.pre_company_titles, ARRAY[]::TEXT[]) as pre_company_titles,
    COALESCE(ss.pre_company_industries, ARRAY[]::TEXT[]) as pre_company_industries,
    COALESCE(ss.pre_company_locations, ARRAY[]::TEXT[]) as pre_company_locations,
    -- POST-COMPANY CAREER FIELDS
    COALESCE(ss.post_company_companies, ARRAY[]::TEXT[]) as post_company_companies,
    COALESCE(ss.post_company_titles, ARRAY[]::TEXT[]) as post_company_titles,
    COALESCE(ss.post_company_industries, ARRAY[]::TEXT[]) as post_company_industries,
    COALESCE(ss.post_company_locations, ARRAY[]::TEXT[]) as post_company_locations,
    COALESCE(ss.functional_expertise, ARRAY[]::TEXT[]) as functional_expertise,
    COALESCE(ss.industry_expertise, ARRAY[]::TEXT[]) as industry_expertise,
    COALESCE(ss.industry_transitions, ARRAY[]::TEXT[]) as industry_transitions,
    COALESCE(ss.education_geography, ARRAY[]::TEXT[]) as education_geography,
    -- Additional fields
    ss.chick_fil_a_exit_year,
    COALESCE(ss.had_multiple_company_stints, FALSE) as had_multiple_company_stints,
    ss.years_since_chick_fil_a,
    
    -- CHRONOLOGICAL-SPECIFIC DATA (preserved from original function)
    COALESCE(cda.career_timeline, ''{}''::jsonb) as career_timeline,
    COALESCE(cda.education_timeline, ''{}''::jsonb) as education_timeline,
    jsonb_build_object(
      ''total_years_experience'', cda.total_years_experience,
      ''years_in_target_industry'', cda.years_in_target_industry,
      ''timeline_pattern'', cda.timeline_pattern,
      ''sequence_gap_months'', cda.sequence_gap_months,
      ''has_concurrent_activities'', cda.has_concurrent_activities,
      ''has_geographic_mobility'', cda.has_geographic_mobility,
      ''has_leadership_experience'', cda.has_leadership_experience,
      ''has_management_responsibility'', cda.has_management_responsibility,
      ''has_pre_company_experience'', cda.has_pre_company_experience,
      ''has_post_company_experience'', cda.has_post_company_experience,
      ''worked_at_target_company'', cda.worked_at_target_company,
      ''worked_during_company'', cda.worked_during_company,
      ''educated_before_company'', cda.educated_before_company,
      ''educated_during_company'', cda.educated_during_company,
      ''educated_after_company'', cda.educated_after_company,
      ''highest_degree_level_calculated'', cda.highest_degree_level_calculated,
      ''applied_filters'', $1
    ) as comprehensive_analysis,
    cda.total_years_experience,
    cda.years_in_target_industry,
    cda.timeline_pattern,
    cda.sequence_gap_months::int,
    cda.has_concurrent_activities
  FROM cross_domain_analysis cda
  LEFT JOIN %I ss ON cda.profile_id = ss.profile_id
  WHERE 
    -- TIER 1 FILTERS: Leadership & Management
    ((($1->>''has_leadership_experience'')::boolean) IS NULL OR cda.has_leadership_experience = (($1->>''has_leadership_experience'')::boolean))
    AND ((($1->>''has_management_responsibility'')::boolean) IS NULL OR cda.has_management_responsibility = (($1->>''has_management_responsibility'')::boolean))
    
    -- TIER 1 FILTERS: Company Relationship
    AND ((($1->>''has_pre_company_experience'')::boolean) IS NULL OR cda.has_pre_company_experience = (($1->>''has_pre_company_experience'')::boolean))
    AND ((($1->>''has_post_company_experience'')::boolean) IS NULL OR cda.has_post_company_experience = (($1->>''has_post_company_experience'')::boolean))
    AND ((($1->>''worked_at_target_company'')::boolean) IS NULL OR cda.worked_at_target_company = (($1->>''worked_at_target_company'')::boolean))
    AND ((($1->>''worked_during_company'')::boolean) IS NULL OR cda.worked_during_company = (($1->>''worked_during_company'')::boolean))
    
    -- TIER 1 FILTERS: Education Relationship  
    AND ((($1->>''educated_before_company'')::boolean) IS NULL OR cda.educated_before_company = (($1->>''educated_before_company'')::boolean))
    AND ((($1->>''educated_during_company'')::boolean) IS NULL OR cda.educated_during_company = (($1->>''educated_during_company'')::boolean))
    AND ((($1->>''educated_after_company'')::boolean) IS NULL OR cda.educated_after_company = (($1->>''educated_after_company'')::boolean))
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
  career_events_table,     -- ce6 for company size filter
  standard_search_table    -- Changed from vector_table to standard_search_table
  ) 
  USING 
    chronological_filters,           -- $1 (JSON with all filters)
    limit_count;                     -- $2
    
END;
$$ LANGUAGE plpgsql;

-- Add documentation
COMMENT ON FUNCTION llm_integrated_chronological_search_chick_fil_a IS 'Enhanced chronological search with RICH PROFILE DATA and TIER 1 FILTERS. Combines strict chronological filtering with comprehensive alumni profiles from the standard search table. 

SUPPORTED FILTERS:
- Text Filters: school_filter, company_filter, industry_filter, title_filter, location_filter, company_size_filter, degree_level_filter
- Numeric Filters: total_experience_years (>=), min_years_in_industry (>=)
- Boolean Filters: geographic_mobility, concurrent_activities
- TIER 1 Leadership: has_leadership_experience, has_management_responsibility  
- TIER 1 Company Relationship: has_pre_company_experience, has_post_company_experience, worked_at_target_company, worked_during_company
- TIER 1 Education Relationship: educated_before_company, educated_during_company, educated_after_company

All filters are hard requirements that must be satisfied. Results are ordered by total years of experience.'; 