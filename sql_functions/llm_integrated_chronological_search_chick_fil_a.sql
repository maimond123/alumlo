CREATE OR REPLACE FUNCTION llm_integrated_chronological_search_chick_fil_a(
  -- LLM PIPELINE INPUTS
  chronological_filters jsonb DEFAULT '{}',  -- Output from translateWithoutClassificationContext
  weight_assignment jsonb DEFAULT '{}',      -- Output from weight assignment LLM
  
  -- ADDITIONAL SEARCH PARAMETERS
  limit_count int DEFAULT 20,
  organization_name text DEFAULT 'chick_fil_a'
)
RETURNS TABLE (
  profile_id bigint,
  name text,
  career_timeline jsonb,
  education_timeline jsonb,
  comprehensive_analysis jsonb,
  
  -- Current state for quick reference (from vector table)
  current_company text,
  current_title text,
  current_industry text,
  current_location text,
  
  -- Career progression metrics (calculated from event tables)
  total_years_experience numeric,
  years_in_target_industry numeric,
  career_progression_score float,
  
  -- Education progression metrics (calculated from event tables)
  highest_degree_level text,
  education_progression_score float,
  
  -- Cross-domain analysis
  timeline_pattern text,
  sequence_gap_months int,
  has_concurrent_activities boolean,
  
  -- Dynamic chronological relevance score using LLM weights
  chronological_relevance_score float
) AS $$
DECLARE
  -- Extract LLM weights with defaults
  weight_career_quality numeric := COALESCE((weight_assignment->>'career_quality')::numeric, 0.4);
  weight_education_quality numeric := COALESCE((weight_assignment->>'education_quality')::numeric, 0.25);
  weight_timeline_precision numeric := COALESCE((weight_assignment->>'timeline_precision')::numeric, 0.25);
  weight_filter_specificity numeric := COALESCE((weight_assignment->>'filter_specificity')::numeric, 0.1);
  
  -- Extract filter values with fallbacks
  min_years_in_industry numeric := COALESCE((chronological_filters->>'min_years_in_industry')::numeric, NULL);
  min_years_in_function numeric := COALESCE((chronological_filters->>'min_years_in_function')::numeric, NULL);
  total_experience_years numeric := COALESCE((chronological_filters->>'total_experience_years')::numeric, NULL);
  career_progression_pattern text := chronological_filters->>'career_progression_pattern';
  gap_tolerance numeric := COALESCE((chronological_filters->>'gap_tolerance')::numeric, 6);
  concurrent_activities boolean := COALESCE((chronological_filters->>'concurrent_activities')::boolean, FALSE);
  geographic_mobility boolean := COALESCE((chronological_filters->>'geographic_mobility')::boolean, FALSE);
  
  -- ADD MISSING BASIC FILTERS - This is the bug fix!
  school_filter text := chronological_filters->>'school_filter';
  company_filter text := chronological_filters->>'company_filter';
  industry_filter text := chronological_filters->>'industry_filter';
  title_filter text := chronological_filters->>'title_filter';
  location_filter text := chronological_filters->>'location_filter';
  
  -- Education filters
  degree_level_progression jsonb := chronological_filters->'degree_level_progression';
  education_industry_alignment boolean := COALESCE((chronological_filters->>'education_industry_alignment')::boolean, FALSE);
  
  -- Industry and company transitions
  industry_transitions jsonb := chronological_filters->'industry_transitions';
  company_size_progression jsonb := chronological_filters->'company_size_progression';
  
  -- Dynamic table name based on organization
  career_events_table text := organization_name || '_alumni_career_events';
  education_events_table text := organization_name || '_alumni_education_events';
  vector_table text := organization_name || '_alumni_vector';
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
          CASE WHEN ($3 IS NULL OR ce.industry ILIKE ''%%'' || $3 || ''%%'') THEN
            CASE WHEN ce.end_year = 9999 THEN 
              (EXTRACT(YEAR FROM NOW()) - ce.start_year) * 12 + 
              (EXTRACT(MONTH FROM NOW()) - ce.start_month)
            ELSE 
              (ce.end_year - ce.start_year) * 12 + (ce.end_month - ce.start_month)
            END
          ELSE 0 END
        ) / 12.0, 0
      ) as years_in_target_industry,
      
      -- Career progression score based on patterns and leadership
      CASE 
        WHEN $4 IS NOT NULL THEN
          CASE $4
            WHEN ''individual_contributor_to_management'' THEN
              CASE WHEN bool_or(ce.is_leadership_role) AND bool_or(NOT ce.management_responsibility) THEN 1.0 ELSE 0.3 END
            WHEN ''entry_level_to_senior'' THEN
              CASE WHEN MAX(ce.job_level) ILIKE ''%%Senior%%'' OR MAX(ce.job_level) ILIKE ''%%Lead%%'' THEN 0.9 ELSE 0.4 END
            WHEN ''startup_to_enterprise'' THEN
              CASE WHEN bool_and(ce.company_size IN (''Startup'', ''Large'')) THEN 0.8 ELSE 0.3 END
            WHEN ''rapid_advancement'' THEN
              CASE WHEN COUNT(DISTINCT ce.job_level) >= 3 THEN 1.0 ELSE 0.5 END
            ELSE 0.5
          END
        ELSE
          -- Default progression scoring
          CASE 
            WHEN COUNT(DISTINCT ce.job_level) > 1 THEN
              (COUNT(DISTINCT ce.job_level) - 1) * 0.25 + 
              (CASE WHEN bool_or(ce.is_leadership_role) THEN 0.3 ELSE 0 END)
            ELSE 0.2
          END
      END as career_progression_score,
      
      -- Geographic mobility check
      COUNT(DISTINCT ce.location) > 1 as has_geographic_mobility,
      
      -- Latest and earliest career dates for timeline analysis
      MAX(ce.end_year * 12 + ce.end_month) as latest_career_end_month,
      MIN(ce.start_year * 12 + ce.start_month) as earliest_career_start_month
      
    FROM %I ce
    WHERE 
      -- Apply career filters
      ($14 IS NULL OR ce.company ILIKE ''%%'' || $14 || ''%%'')
      AND ($15 IS NULL OR ce.industry ILIKE ''%%'' || $15 || ''%%'')
      AND ($16 IS NULL OR ce.title ILIKE ''%%'' || $16 || ''%%'')
      AND ($17 IS NULL OR ce.location ILIKE ''%%'' || $17 || ''%%'')
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
          ''degree'', ee.degree,
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
      
      -- Education progression score with LLM pattern matching
      CASE 
        WHEN $6 IS NOT NULL THEN
          -- Check if actual progression matches expected pattern
          CASE WHEN jsonb_array_length($6) > 0 THEN
            CASE 
              WHEN COUNT(DISTINCT ee.degree_level) >= jsonb_array_length($6) THEN 1.0
              ELSE COUNT(DISTINCT ee.degree_level)::float / jsonb_array_length($6)
            END
          ELSE 0.5
          END
        ELSE
          -- Default progression scoring
          CASE 
            WHEN COUNT(DISTINCT ee.degree_level) >= 3 THEN 1.0  
            WHEN COUNT(DISTINCT ee.degree_level) = 2 THEN 0.7   
            ELSE 0.3
          END
      END as education_progression_score,
      
      -- Latest and earliest education dates for timeline analysis
      MAX(ee.end_year * 12 + ee.end_month) as latest_education_end_month,
      MIN(ee.start_year * 12 + ee.start_month) as earliest_education_start_month
      
    FROM %I ee
    WHERE 
      -- Apply school filter - comprehensive search across institution field
      ($18 IS NULL OR ee.institution ILIKE ''%%'' || $18 || ''%%'')
    GROUP BY ee.profile_id
  ),
  
  cross_domain_analysis AS (
    SELECT 
      COALESCE(ca.profile_id, ea.profile_id) as profile_id,
      ca.career_timeline,
      ea.education_timeline,
      ca.total_years_experience,
      ca.years_in_target_industry,
      ca.career_progression_score,
      ea.highest_degree_level,
      ea.education_progression_score,
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
      
      -- DYNAMIC CHRONOLOGICAL RELEVANCE SCORE using LLM weights
      (
        -- Career quality component (dynamic weight)
        COALESCE(ca.career_progression_score, 0) * $7 +
        
        -- Education quality component (dynamic weight)
        COALESCE(ea.education_progression_score, 0) * $8 +
        
        -- Timeline precision component (dynamic weight)
        CASE 
          WHEN $5 IS NOT NULL THEN -- gap_tolerance provided
            CASE WHEN ABS(COALESCE(ca.earliest_career_start_month, 0) - COALESCE(ea.latest_education_end_month, 0)) <= $5 THEN 1.0 ELSE 0.3 END
          ELSE 0.7 -- Default timeline score
        END * $9 +
        
        -- Filter specificity component (dynamic weight)
        CASE 
          WHEN ca.total_years_experience IS NOT NULL AND ea.highest_degree_level IS NOT NULL THEN 1.0
          WHEN ca.total_years_experience IS NOT NULL OR ea.highest_degree_level IS NOT NULL THEN 0.7
          ELSE 0.4
        END * $10
      ) as chronological_relevance_score
      
    FROM career_analysis ca
    FULL OUTER JOIN education_analysis ea ON ca.profile_id = ea.profile_id
    WHERE 
      -- STRICT FILTER ENFORCEMENT: All filters must be satisfied
      
      -- Experience filters (existing)
      ($2 IS NULL OR COALESCE(ca.total_years_experience, 0) >= $2)
      AND ($3 IS NULL OR COALESCE(ca.years_in_target_industry, 0) >= $3)
      AND ($11 IS FALSE OR COALESCE(ca.has_geographic_mobility, FALSE) = $11)
      AND ($12 IS FALSE OR 
           CASE 
             WHEN ea.earliest_education_start_month IS NOT NULL AND ca.latest_career_end_month IS NOT NULL AND
                  ca.earliest_career_start_month IS NOT NULL AND ea.latest_education_end_month IS NOT NULL THEN
               (ea.earliest_education_start_month <= ca.latest_career_end_month AND 
                ca.earliest_career_start_month <= ea.latest_education_end_month) = $12
             ELSE $12 = FALSE
           END)
      
      -- NEW: HARD SCHOOL FILTER ENFORCEMENT
      AND ($18 IS NULL OR 
           (ea.profile_id IS NOT NULL AND 
            EXISTS (SELECT 1 FROM %I ee2 WHERE ee2.profile_id = ea.profile_id 
                    AND ee2.institution ILIKE ''%%'' || $18 || ''%%'')))
      
      -- NEW: HARD COMPANY FILTER ENFORCEMENT  
      AND ($14 IS NULL OR 
           (ca.profile_id IS NOT NULL AND
            EXISTS (SELECT 1 FROM %I ce2 WHERE ce2.profile_id = ca.profile_id
                    AND ce2.company ILIKE ''%%'' || $14 || ''%%'')))
      
      -- NEW: HARD INDUSTRY FILTER ENFORCEMENT
      AND ($15 IS NULL OR 
           (ca.profile_id IS NOT NULL AND
            EXISTS (SELECT 1 FROM %I ce3 WHERE ce3.profile_id = ca.profile_id
                    AND ce3.industry ILIKE ''%%'' || $15 || ''%%'')))
      
      -- NEW: HARD TITLE FILTER ENFORCEMENT
      AND ($16 IS NULL OR 
           (ca.profile_id IS NOT NULL AND
            EXISTS (SELECT 1 FROM %I ce4 WHERE ce4.profile_id = ca.profile_id
                    AND ce4.title ILIKE ''%%'' || $16 || ''%%'')))
      
      -- NEW: HARD LOCATION FILTER ENFORCEMENT
      AND ($17 IS NULL OR 
           (ca.profile_id IS NOT NULL AND
            EXISTS (SELECT 1 FROM %I ce5 WHERE ce5.profile_id = ca.profile_id
                    AND ce5.location ILIKE ''%%'' || $17 || ''%%'')))
  )
  
  SELECT 
    cda.profile_id,
    COALESCE(av.name, ''Unknown'') as name,
    COALESCE(cda.career_timeline, ''{}''::jsonb) as career_timeline,
    COALESCE(cda.education_timeline, ''{}''::jsonb) as education_timeline,
    jsonb_build_object(
      ''total_years_experience'', cda.total_years_experience,
      ''years_in_target_industry'', cda.years_in_target_industry,
      ''career_progression_score'', cda.career_progression_score,
      ''education_progression_score'', cda.education_progression_score,
      ''timeline_pattern'', cda.timeline_pattern,
      ''sequence_gap_months'', cda.sequence_gap_months,
      ''has_concurrent_activities'', cda.has_concurrent_activities,
      ''has_geographic_mobility'', cda.has_geographic_mobility,
      ''chronological_relevance_score'', cda.chronological_relevance_score,
      ''applied_weights'', jsonb_build_object(
        ''career_quality'', $7,
        ''education_quality'', $8,
        ''timeline_precision'', $9,
        ''filter_specificity'', $10
      ),
      ''applied_filters'', $1
    ) as comprehensive_analysis,
    COALESCE(av.post_company_current_company, ''Unknown'') as current_company,
    COALESCE(av.post_company_current_title, ''Unknown'') as current_title,
    COALESCE(av.post_company_current_industry, ''Unknown'') as current_industry,
    COALESCE(av.post_company_current_location, ''Unknown'') as current_location,
    cda.total_years_experience,
    cda.years_in_target_industry,
    cda.career_progression_score,
    cda.highest_degree_level,
    cda.education_progression_score,
    cda.timeline_pattern,
    cda.sequence_gap_months::int,
    cda.has_concurrent_activities,
    cda.chronological_relevance_score
  FROM cross_domain_analysis cda
  LEFT JOIN %I av ON cda.profile_id = av.profile_id
  ORDER BY cda.chronological_relevance_score DESC
  LIMIT $13
  ', 
  career_events_table, 
  education_events_table, 
  education_events_table,  -- ee2 for school filter
  career_events_table,     -- ce2 for company filter  
  career_events_table,     -- ce3 for industry filter
  career_events_table,     -- ce4 for title filter
  career_events_table,     -- ce5 for location filter
  vector_table
  ) 
  USING 
    chronological_filters,           -- $1
    total_experience_years,          -- $2 
    min_years_in_industry,           -- $3
    career_progression_pattern,      -- $4
    gap_tolerance,                   -- $5
    degree_level_progression,        -- $6
    weight_career_quality,           -- $7
    weight_education_quality,        -- $8  
    weight_timeline_precision,       -- $9
    weight_filter_specificity,       -- $10
    geographic_mobility,             -- $11
    concurrent_activities,           -- $12
    limit_count,                     -- $13
    company_filter,                  -- $14 - NEW
    industry_filter,                 -- $15 - NEW
    title_filter,                    -- $16 - NEW
    location_filter,                 -- $17 - NEW
    school_filter;                   -- $18 - NEW (This is the Georgetown fix!)
    
END;
$$ LANGUAGE plpgsql;

-- Add documentation
COMMENT ON FUNCTION llm_integrated_chronological_search_chick_fil_a IS 'LLM-integrated chronological search with STRICT FILTER ENFORCEMENT. All filters (school, company, industry, title, location) are hard requirements that must be satisfied before scoring. Scoring is used purely for ranking compliant profiles. No profile can bypass filter requirements through high scores.'; 