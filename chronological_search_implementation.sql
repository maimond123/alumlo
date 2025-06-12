-- Chronological Search Function with Dynamic Weights
-- Compatible with the provided career_events and education_events table schema

CREATE OR REPLACE FUNCTION comprehensive_chronological_search_with_weights(
  -- Table name parameters (to support multiple event tables)
  career_events_table_name text DEFAULT 'career_events',
  education_events_table_name text DEFAULT 'education_events',
  
  -- CAREER FILTERS
  career_company_filter text DEFAULT NULL,
  career_title_filter text DEFAULT NULL,
  career_industry_filter text DEFAULT NULL,
  career_job_level_filter text DEFAULT NULL,
  career_location_filter text DEFAULT NULL,
  career_company_size_filter text DEFAULT NULL,
  min_total_experience_years int DEFAULT NULL,
  require_management_experience boolean DEFAULT NULL,
  require_leadership_experience boolean DEFAULT NULL,
  
  -- EDUCATION FILTERS
  education_institution_filter text DEFAULT NULL,
  education_degree_name_filter text DEFAULT NULL,
  education_degree_level_filter text DEFAULT NULL,
  education_location_filter text DEFAULT NULL,
  min_graduation_year int DEFAULT NULL,
  max_graduation_year int DEFAULT NULL,
  
  -- TEMPORAL RELATIONSHIP FILTERS
  sequence_pattern text DEFAULT 'any', -- 'education_then_career', 'career_then_education', 'concurrent', 'any'
  max_gap_months int DEFAULT 24,
  min_gap_months int DEFAULT 0,
  require_concurrent_activities boolean DEFAULT NULL,
  require_geographic_mobility boolean DEFAULT NULL,
  
  -- TIMELINE CONTEXT FILTERS
  timeline_context_filter text DEFAULT NULL, -- 'target_company', 'pre_company', 'during_company', 'post_company', 'unrelated'
  education_timeline_filter text DEFAULT NULL, -- 'pre_company', 'during_company', 'post_company', 'unrelated'
  include_unrelated_positions boolean DEFAULT TRUE,
  include_unrelated_education boolean DEFAULT TRUE,
  
  -- DYNAMIC WEIGHTS (from LLM assignment)
  weight_career_quality float DEFAULT 0.4,
  weight_education_quality float DEFAULT 0.25,
  weight_timeline_precision float DEFAULT 0.25,
  weight_filter_specificity float DEFAULT 0.1,
  
  -- RESULT CONFIGURATION
  limit_count int DEFAULT 20,
  order_by text DEFAULT 'relevance_score' -- 'relevance_score', 'career_quality', 'education_quality', 'timeline_precision'
)
RETURNS TABLE (
  profile_id bigint,
  career_timeline jsonb,
  education_timeline jsonb,
  
  -- Component scores
  career_quality_score float,
  education_quality_score float,
  timeline_precision_score float,
  filter_specificity_score float,
  
  -- Final weighted score
  final_relevance_score float,
  
  -- Analysis metadata
  total_years_experience numeric,
  career_progression_count int,
  highest_degree_level text,
  timeline_pattern_match text,
  gap_months int,
  has_concurrent_activities boolean,
  has_geographic_mobility boolean,
  
  -- Weight information for transparency
  applied_weights jsonb
) AS $$
DECLARE
  career_table_name text := quote_ident(career_events_table_name);
  education_table_name text := quote_ident(education_events_table_name);
  sql_query text;
BEGIN
  
  -- Build dynamic SQL query
  sql_query := format('
  WITH career_analysis AS (
    SELECT 
      ce.profile_id,
      
      -- Build career timeline JSON
      jsonb_object_agg(
        ce.start_year::text || ''-'' || ce.start_month::text,
        jsonb_build_object(
          ''event_id'', ce.event_id,
          ''event_type'', ce.event_type,
          ''sequence_number'', ce.sequence_number,
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
          ''is_target_company'', ce.is_target_company_position,
          ''is_pre_company'', ce.is_pre_company_position,
          ''is_during_company'', ce.is_during_company_position,
          ''is_post_company'', ce.is_post_company_position,
          ''is_unrelated'', ce.is_unrelated_position
        )
      ) as career_timeline,
      
      -- Calculate total experience (in years)
      SUM(
        CASE WHEN ce.end_year = 9999 THEN 
          (EXTRACT(YEAR FROM NOW()) - ce.start_year) + 
          (EXTRACT(MONTH FROM NOW()) - ce.start_month) / 12.0
        ELSE 
          (ce.end_year - ce.start_year) + (ce.end_month - ce.start_month) / 12.0
        END
      ) as total_years_experience,
      
      -- Career progression metrics
      COUNT(DISTINCT ce.job_level) as distinct_job_levels,
      COUNT(*) FILTER (WHERE ce.management_responsibility = true) as management_positions,
      COUNT(*) FILTER (WHERE ce.is_leadership_role = true) as leadership_positions,
      COUNT(DISTINCT ce.industry) as distinct_industries,
      COUNT(DISTINCT ce.company_size) as company_size_variety,
      COUNT(DISTINCT ce.location) as distinct_locations,
      
      -- Timeline boundaries for cross-domain analysis
      MIN(ce.start_year * 12 + ce.start_month) as earliest_career_start_month,
      MAX(CASE WHEN ce.end_year = 9999 THEN 
        EXTRACT(YEAR FROM NOW()) * 12 + EXTRACT(MONTH FROM NOW())
        ELSE ce.end_year * 12 + ce.end_month END) as latest_career_end_month,
      
      -- Filter matching
      bool_and(
        CASE WHEN %L IS NOT NULL THEN ce.company ILIKE ''%%'' || %L || ''%%'' ELSE TRUE END AND
        CASE WHEN %L IS NOT NULL THEN ce.title ILIKE ''%%'' || %L || ''%%'' ELSE TRUE END AND
        CASE WHEN %L IS NOT NULL THEN ce.industry ILIKE ''%%'' || %L || ''%%'' ELSE TRUE END AND
        CASE WHEN %L IS NOT NULL THEN ce.job_level ILIKE ''%%'' || %L || ''%%'' ELSE TRUE END AND
        CASE WHEN %L IS NOT NULL THEN ce.location ILIKE ''%%'' || %L || ''%%'' ELSE TRUE END AND
        CASE WHEN %L IS NOT NULL THEN ce.company_size ILIKE ''%%'' || %L || ''%%'' ELSE TRUE END AND
        CASE WHEN %L IS NOT NULL THEN ce.management_responsibility = %L ELSE TRUE END AND
        CASE WHEN %L IS NOT NULL THEN ce.is_leadership_role = %L ELSE TRUE END AND
        CASE WHEN %L IS NOT NULL THEN 
          CASE %L
            WHEN ''target_company'' THEN ce.is_target_company_position = TRUE
            WHEN ''pre_company'' THEN ce.is_pre_company_position = TRUE
            WHEN ''during_company'' THEN ce.is_during_company_position = TRUE
            WHEN ''post_company'' THEN ce.is_post_company_position = TRUE
            WHEN ''unrelated'' THEN ce.is_unrelated_position = TRUE
            ELSE TRUE
          END
        ELSE TRUE END
      ) as matches_career_filters,
      
      -- Specific filter matches for specificity scoring
      COUNT(*) FILTER (WHERE 
        (%L IS NOT NULL AND ce.company ILIKE ''%%'' || %L || ''%%'') OR
        (%L IS NOT NULL AND ce.title ILIKE ''%%'' || %L || ''%%'') OR
        (%L IS NOT NULL AND ce.industry ILIKE ''%%'' || %L || ''%%'') OR
        (%L IS NOT NULL AND ce.location ILIKE ''%%'' || %L || ''%%'')
      ) as career_filter_matches
      
    FROM %I ce
    WHERE 
      (%L = TRUE OR ce.is_unrelated_position = FALSE)
    GROUP BY ce.profile_id
  ),
  
  education_analysis AS (
    SELECT 
      ee.profile_id,
      
      -- Build education timeline JSON
      jsonb_object_agg(
        ee.start_year::text || ''-'' || ee.start_month::text,
        jsonb_build_object(
          ''event_id'', ee.event_id,
          ''event_type'', ee.event_type,
          ''sequence_number'', ee.sequence_number,
          ''institution'', ee.institution,
          ''degree_name'', ee.degree_name,
          ''degree_level'', ee.degree_level,
          ''location'', ee.location,
          ''start_year'', ee.start_year,
          ''start_month'', ee.start_month,
          ''end_year'', ee.end_year,
          ''end_month'', ee.end_month,
          ''graduation_year'', ee.graduation_year,
          ''is_current'', ee.is_current,
          ''grade'', ee.grade,
          ''is_pre_company'', ee.is_pre_company_education,
          ''is_during_company'', ee.is_during_company_education,
          ''is_post_company'', ee.is_post_company_education,
          ''is_unrelated'', ee.is_unrelated_education
        )
      ) as education_timeline,
      
      -- Education progression metrics
      COUNT(DISTINCT ee.degree_level) as distinct_degree_levels,
      COUNT(DISTINCT ee.institution) as distinct_institutions,
      MAX(ee.graduation_year) as latest_graduation_year,
      COUNT(DISTINCT ee.location) as education_locations,
      
      -- Determine highest degree level
      CASE 
        WHEN bool_or(ee.degree_level ILIKE ''%%PhD%%'' OR ee.degree_level ILIKE ''%%Doctorate%%'') THEN ''Doctorate''
        WHEN bool_or(ee.degree_level ILIKE ''%%Master%%'' OR ee.degree_level ILIKE ''%%MBA%%'') THEN ''Master''''s''
        WHEN bool_or(ee.degree_level ILIKE ''%%Bachelor%%'') THEN ''Bachelor''''s''
        WHEN bool_or(ee.degree_level ILIKE ''%%Associate%%'') THEN ''Associate''
        ELSE ''High School''
      END as highest_degree_level,
      
      -- Timeline boundaries for cross-domain analysis
      MIN(ee.start_year * 12 + ee.start_month) as earliest_education_start_month,
      MAX(ee.end_year * 12 + ee.end_month) as latest_education_end_month,
      
      -- Filter matching
      bool_and(
        CASE WHEN %L IS NOT NULL THEN ee.institution ILIKE ''%%'' || %L || ''%%'' ELSE TRUE END AND
        CASE WHEN %L IS NOT NULL THEN ee.degree_name ILIKE ''%%'' || %L || ''%%'' ELSE TRUE END AND
        CASE WHEN %L IS NOT NULL THEN ee.degree_level ILIKE ''%%'' || %L || ''%%'' ELSE TRUE END AND
        CASE WHEN %L IS NOT NULL THEN ee.location ILIKE ''%%'' || %L || ''%%'' ELSE TRUE END AND
        CASE WHEN %L IS NOT NULL THEN ee.graduation_year >= %L ELSE TRUE END AND
        CASE WHEN %L IS NOT NULL THEN ee.graduation_year <= %L ELSE TRUE END AND
        CASE WHEN %L IS NOT NULL THEN 
          CASE %L
            WHEN ''pre_company'' THEN ee.is_pre_company_education = TRUE
            WHEN ''during_company'' THEN ee.is_during_company_education = TRUE
            WHEN ''post_company'' THEN ee.is_post_company_education = TRUE
            WHEN ''unrelated'' THEN ee.is_unrelated_education = TRUE
            ELSE TRUE
          END
        ELSE TRUE END
      ) as matches_education_filters,
      
      -- Specific filter matches for specificity scoring
      COUNT(*) FILTER (WHERE 
        (%L IS NOT NULL AND ee.institution ILIKE ''%%'' || %L || ''%%'') OR
        (%L IS NOT NULL AND ee.degree_name ILIKE ''%%'' || %L || ''%%'') OR
        (%L IS NOT NULL AND ee.degree_level ILIKE ''%%'' || %L || ''%%'') OR
        (%L IS NOT NULL AND ee.location ILIKE ''%%'' || %L || ''%%'')
      ) as education_filter_matches
      
    FROM %I ee
    WHERE 
      (%L = TRUE OR ee.is_unrelated_education = FALSE)
    GROUP BY ee.profile_id
  ),
  
  scoring AS (
    SELECT 
      COALESCE(ca.profile_id, ea.profile_id) as profile_id,
      COALESCE(ca.career_timeline, ''{}''::jsonb) as career_timeline,
      COALESCE(ea.education_timeline, ''{}''::jsonb) as education_timeline,
      
      -- CAREER QUALITY SCORE (combines experience + progression + leadership)
      LEAST(1.0, (
        -- Experience component (0-0.4)
        LEAST(COALESCE(ca.total_years_experience, 0) / 20.0, 0.4) +
        -- Progression component (0-0.3)
        LEAST((COALESCE(ca.distinct_job_levels, 1) - 1) * 0.1, 0.3) +
        -- Leadership component (0-0.3)
        LEAST((COALESCE(ca.management_positions, 0) * 0.1 + COALESCE(ca.leadership_positions, 0) * 0.1), 0.3)
      )) as career_quality_score,
      
      -- EDUCATION QUALITY SCORE (degree progression + institution diversity)
      LEAST(1.0, (
        -- Degree level component (0-0.7)
        CASE ea.highest_degree_level
          WHEN ''Doctorate'' THEN 0.7
          WHEN ''Master''''s'' THEN 0.6
          WHEN ''Bachelor''''s'' THEN 0.4
          WHEN ''Associate'' THEN 0.2
          ELSE 0.1
        END +
        -- Progression component (0-0.3)
        LEAST((COALESCE(ea.distinct_degree_levels, 1) - 1) * 0.15, 0.3)
      )) as education_quality_score,
      
      -- TIMELINE PRECISION SCORE (sequence pattern matching + gap analysis)
      CASE 
        WHEN %L = ''education_then_career'' THEN
          CASE WHEN COALESCE(ea.latest_education_end_month, 0) <= COALESCE(ca.earliest_career_start_month, 999999) THEN
            GREATEST(0, 1.0 - ABS(COALESCE(ca.earliest_career_start_month, 0) - COALESCE(ea.latest_education_end_month, 0)) / 24.0)
          ELSE 0 END
        WHEN %L = ''career_then_education'' THEN
          CASE WHEN COALESCE(ca.latest_career_end_month, 0) <= COALESCE(ea.earliest_education_start_month, 999999) THEN
            GREATEST(0, 1.0 - ABS(COALESCE(ea.earliest_education_start_month, 0) - COALESCE(ca.latest_career_end_month, 0)) / 24.0)
          ELSE 0 END
        WHEN %L = ''concurrent'' THEN
          CASE WHEN (COALESCE(ea.earliest_education_start_month, 0) <= COALESCE(ca.latest_career_end_month, 0) AND
                     COALESCE(ca.earliest_career_start_month, 0) <= COALESCE(ea.latest_education_end_month, 0)) THEN 0.9
          ELSE 0 END
        ELSE 0.5 -- ''any'' pattern gets neutral score
      END as timeline_precision_score,
      
      -- FILTER SPECIFICITY SCORE (exact matches to specific criteria)
      LEAST(1.0, (
        COALESCE(ca.career_filter_matches, 0) * 0.1 + 
        COALESCE(ea.education_filter_matches, 0) * 0.1
      )) as filter_specificity_score,
      
      -- Store component values for analysis
      ca.total_years_experience,
      ca.distinct_job_levels as career_progression_count,
      ea.highest_degree_level,
      
      -- Timeline pattern analysis
      CASE 
        WHEN %L = ''education_then_career'' AND 
             COALESCE(ea.latest_education_end_month, 0) <= COALESCE(ca.earliest_career_start_month, 999999) THEN ''education_then_career''
        WHEN %L = ''career_then_education'' AND 
             COALESCE(ca.latest_career_end_month, 0) <= COALESCE(ea.earliest_education_start_month, 999999) THEN ''career_then_education''
        WHEN %L = ''concurrent'' AND 
             (COALESCE(ea.earliest_education_start_month, 0) <= COALESCE(ca.latest_career_end_month, 0) AND
              COALESCE(ca.earliest_career_start_month, 0) <= COALESCE(ea.latest_education_end_month, 0)) THEN ''concurrent''
        ELSE ''no_clear_pattern''
      END as timeline_pattern_match,
      
      -- Gap calculation
      CASE 
        WHEN %L = ''education_then_career'' THEN 
          COALESCE(ca.earliest_career_start_month, 0) - COALESCE(ea.latest_education_end_month, 0)
        WHEN %L = ''career_then_education'' THEN 
          COALESCE(ea.earliest_education_start_month, 0) - COALESCE(ca.latest_career_end_month, 0)
        ELSE 0
      END as gap_months,
      
      -- Concurrent activities detection
      (COALESCE(ea.earliest_education_start_month, 0) <= COALESCE(ca.latest_career_end_month, 0) AND
       COALESCE(ca.earliest_career_start_month, 0) <= COALESCE(ea.latest_education_end_month, 0)) as has_concurrent_activities,
      
      -- Geographic mobility detection
      COALESCE(ca.distinct_locations, 0) > 1 as has_geographic_mobility,
      
      -- Filter matching
      COALESCE(ca.matches_career_filters, TRUE) AND COALESCE(ea.matches_education_filters, TRUE) as matches_all_filters
      
    FROM career_analysis ca
    FULL OUTER JOIN education_analysis ea ON ca.profile_id = ea.profile_id
  )
  
  SELECT 
    s.profile_id,
    s.career_timeline,
    s.education_timeline,
    s.career_quality_score,
    s.education_quality_score,
    s.timeline_precision_score,
    s.filter_specificity_score,
    
    -- Calculate final weighted relevance score
    (s.career_quality_score * %L + 
     s.education_quality_score * %L + 
     s.timeline_precision_score * %L + 
     s.filter_specificity_score * %L) as final_relevance_score,
    
    s.total_years_experience,
    s.career_progression_count,
    s.highest_degree_level,
    s.timeline_pattern_match,
    s.gap_months::int,
    s.has_concurrent_activities,
    s.has_geographic_mobility,
    
    -- Include applied weights for transparency
    jsonb_build_object(
      ''career_quality'', %L,
      ''education_quality'', %L,
      ''timeline_precision'', %L,
      ''filter_specificity'', %L
    ) as applied_weights
    
  FROM scoring s
  WHERE 
    s.matches_all_filters = TRUE
    -- Apply experience filter
    AND (CASE WHEN %L IS NOT NULL THEN COALESCE(s.total_years_experience, 0) >= %L ELSE TRUE END)
    -- Apply gap constraints
    AND (CASE WHEN %L != ''any'' THEN ABS(s.gap_months) <= %L ELSE TRUE END)
    AND (CASE WHEN %L != ''any'' THEN ABS(s.gap_months) >= %L ELSE TRUE END)
    -- Apply concurrent activities filter
    AND (CASE WHEN %L IS NOT NULL THEN s.has_concurrent_activities = %L ELSE TRUE END)
    -- Apply geographic mobility filter
    AND (CASE WHEN %L IS NOT NULL THEN s.has_geographic_mobility = %L ELSE TRUE END)
  
  ORDER BY 
    CASE %L
      WHEN ''relevance_score'' THEN final_relevance_score
      WHEN ''career_quality'' THEN s.career_quality_score
      WHEN ''education_quality'' THEN s.education_quality_score
      WHEN ''timeline_precision'' THEN s.timeline_precision_score
      ELSE final_relevance_score
    END DESC
  LIMIT %L
  ',
  -- Parameter substitutions in order
  career_table_name,
  career_company_filter, career_company_filter,
  career_title_filter, career_title_filter,
  career_industry_filter, career_industry_filter,
  career_job_level_filter, career_job_level_filter,
  career_location_filter, career_location_filter,
  career_company_size_filter, career_company_size_filter,
  require_management_experience, require_management_experience,
  require_leadership_experience, require_leadership_experience,
  timeline_context_filter, timeline_context_filter,
  career_company_filter, career_title_filter, career_industry_filter, career_location_filter,
  include_unrelated_positions,
  education_table_name,
  education_institution_filter, education_institution_filter,
  education_degree_name_filter, education_degree_name_filter,
  education_degree_level_filter, education_degree_level_filter,
  education_location_filter, education_location_filter,
  min_graduation_year, min_graduation_year,
  max_graduation_year, max_graduation_year,
  education_timeline_filter, education_timeline_filter,
  education_institution_filter, education_degree_name_filter, education_degree_level_filter, education_location_filter,
  include_unrelated_education,
  sequence_pattern, sequence_pattern, sequence_pattern, sequence_pattern, sequence_pattern, sequence_pattern, sequence_pattern,
  weight_career_quality, weight_education_quality, weight_timeline_precision, weight_filter_specificity,
  weight_career_quality, weight_education_quality, weight_timeline_precision, weight_filter_specificity,
  min_total_experience_years, min_total_experience_years,
  sequence_pattern, max_gap_months,
  sequence_pattern, min_gap_months,
  require_concurrent_activities, require_concurrent_activities,
  require_geographic_mobility, require_geographic_mobility,
  order_by,
  limit_count
  );
  
  -- Execute the dynamic query
  RETURN QUERY EXECUTE sql_query;
  
END;
$$ LANGUAGE plpgsql;

-- Add documentation
COMMENT ON FUNCTION comprehensive_chronological_search_with_weights IS 'Advanced chronological search with LLM-driven dynamic weight assignment. Supports career progression analysis, education timeline tracking, and temporal relationship detection.';

-- Example usage queries for testing
/*

-- Experience-focused query
SELECT * FROM comprehensive_chronological_search_with_weights(
  min_total_experience_years := 5,
  weight_career_quality := 0.7,
  weight_education_quality := 0.1,
  weight_timeline_precision := 0.1,
  weight_filter_specificity := 0.1,
  order_by := 'career_quality'
);

-- Timeline-focused query  
SELECT * FROM comprehensive_chronological_search_with_weights(
  sequence_pattern := 'career_then_education',
  max_gap_months := 12,
  weight_career_quality := 0.2,
  weight_education_quality := 0.2,
  weight_timeline_precision := 0.6,
  weight_filter_specificity := 0.0
);

-- Filter-specific query
SELECT * FROM comprehensive_chronological_search_with_weights(
  career_company_filter := 'Google',
  education_institution_filter := 'Stanford',
  weight_career_quality := 0.2,
  weight_education_quality := 0.2,
  weight_timeline_precision := 0.2,
  weight_filter_specificity := 0.4
);

-- Complex progression query
SELECT * FROM comprehensive_chronological_search_with_weights(
  require_management_experience := true,
  education_degree_level_filter := 'MBA',
  weight_career_quality := 0.4,
  weight_education_quality := 0.3,
  weight_timeline_precision := 0.2,
  weight_filter_specificity := 0.1
);

*/ 