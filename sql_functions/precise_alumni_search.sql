-- Create the comprehensive standard search function with JSON parameter approach
DROP FUNCTION IF EXISTS comprehensive_standard_search_chick_fil_a;
-- Create the comprehensive standard search function with JSON parameter approach
CREATE OR REPLACE FUNCTION comprehensive_standard_search_chick_fil_a(
  search_filters JSONB DEFAULT '{}',
  search_query TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
  id BIGINT,
  profile_id BIGINT,
  name TEXT,
  profile_url TEXT,
  picture_url TEXT,
  headline TEXT,
  home_location TEXT,
  post_company_current_company TEXT,
  post_company_current_title TEXT,
  post_company_current_industry TEXT,
  post_company_current_location TEXT,
  current_company TEXT,
  current_title TEXT,
  current_job_location TEXT,
  current_job_level TEXT,
  current_job_function TEXT,
  career_stage TEXT,
  career_trajectory TEXT,
  is_current_leader BOOLEAN,
  management_experience BOOLEAN,
  revenue_responsibility BOOLEAN,
  current_company_size_category TEXT,
  has_startup_experience BOOLEAN,
  has_enterprise_experience BOOLEAN,
  technical_background BOOLEAN,
  sales_experience BOOLEAN,
  consulting_experience BOOLEAN,
  restaurant_operations_experience BOOLEAN,
  is_remote_worker BOOLEAN,
  highest_degree_level TEXT,
  school_ranking_tier TEXT,
  major_category TEXT,
  undergraduate_major TEXT,
  graduate_specialization TEXT,
  stem_education BOOLEAN,
  business_education BOOLEAN,
  elite_education BOOLEAN,
  continued_education BOOLEAN,
  executive_education BOOLEAN,
  technical_certifications BOOLEAN,
  mentor_potential BOOLEAN,
  likely_job_seeking BOOLEAN,
  total_positions_count INTEGER,
  average_tenure_months DECIMAL,
  current_estimated_salary DECIMAL,
  highest_career_salary DECIMAL,
  pre_chick_fil_a_salary DECIMAL,
  first_post_chick_fil_a_salary DECIMAL,
  chick_fil_a_provided_salary_lift BOOLEAN,
  achieved_six_figure_post_chick_fil_a BOOLEAN,
  doubled_salary_post_chick_fil_a BOOLEAN,
  moved_to_leadership_post_chick_fil_a BOOLEAN,
  career_level_increase_post_chick_fil_a BOOLEAN,
  undergraduate_school TEXT[],
  graduate_school TEXT[],
  high_school TEXT[],
  pre_company_education TEXT[],
  during_company_education TEXT[],
  post_company_education TEXT[],
  -- PRE-COMPANY CAREER TRACKING (before Chick-fil-A)
  pre_company_companies TEXT[],
  pre_company_titles TEXT[],
  pre_company_industries TEXT[],
  pre_company_locations TEXT[],
  -- POST-COMPANY CAREER TRACKING (after Chick-fil-A)
  post_company_companies TEXT[],
  post_company_titles TEXT[],
  post_company_industries TEXT[],
  post_company_locations TEXT[],
  functional_expertise TEXT[],
  industry_expertise TEXT[],
  industry_transitions TEXT[],
  education_geography TEXT[],
  -- Additional fields that exist in the table
  chick_fil_a_exit_year INTEGER,
  had_multiple_company_stints BOOLEAN,
  years_since_chick_fil_a INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.profile_id,
    v.name,
    v.profile_url,
    v.picture_url,
    COALESCE(v.headline, '') as headline,
    COALESCE(v.home_location, '') as home_location,
    v.post_company_current_company,
    v.post_company_current_title,
    v.post_company_current_industry,
    v.post_company_current_location,
    v.current_company,
    v.current_title,
    v.current_job_location,
    COALESCE(v.current_job_level, '') as current_job_level,
    COALESCE(v.current_job_function, '') as current_job_function,
    COALESCE(v.career_stage, '') as career_stage,
    COALESCE(v.career_trajectory, '') as career_trajectory,
    COALESCE(v.is_current_leader, FALSE) as is_current_leader,
    COALESCE(v.management_experience, FALSE) as management_experience,
    COALESCE(v.revenue_responsibility, FALSE) as revenue_responsibility,
    COALESCE(v.current_company_size_category, '') as current_company_size_category,
    COALESCE(v.has_startup_experience, FALSE) as has_startup_experience,
    COALESCE(v.has_enterprise_experience, FALSE) as has_enterprise_experience,
    COALESCE(v.technical_background, FALSE) as technical_background,
    COALESCE(v.sales_experience, FALSE) as sales_experience,
    COALESCE(v.consulting_experience, FALSE) as consulting_experience,
    COALESCE(v.restaurant_operations_experience, FALSE) as restaurant_operations_experience,
    COALESCE(v.is_remote_worker, FALSE) as is_remote_worker,
    COALESCE(v.highest_degree_level, '') as highest_degree_level,
    COALESCE(v.school_ranking_tier, '') as school_ranking_tier,
    COALESCE(v.major_category, '') as major_category,
    COALESCE(v.undergraduate_major, '') as undergraduate_major,
    COALESCE(v.graduate_specialization, '') as graduate_specialization,
    COALESCE(v.stem_education, FALSE) as stem_education,
    COALESCE(v.business_education, FALSE) as business_education,
    COALESCE(v.elite_education, FALSE) as elite_education,
    COALESCE(v.continued_education, FALSE) as continued_education,
    COALESCE(v.executive_education, FALSE) as executive_education,
    COALESCE(v.technical_certifications, FALSE) as technical_certifications,
    COALESCE(v.mentor_potential, FALSE) as mentor_potential,
    COALESCE(v.likely_job_seeking, FALSE) as likely_job_seeking,
    COALESCE(v.total_positions_count, 0) as total_positions_count,
    COALESCE(v.average_tenure_months, 0) as average_tenure_months,
    COALESCE(v.current_estimated_salary, 0) as current_estimated_salary,
    COALESCE(v.highest_career_salary, 0) as highest_career_salary,
    COALESCE(v.pre_chick_fil_a_salary, 0) as pre_chick_fil_a_salary,
    COALESCE(v.first_post_chick_fil_a_salary, 0) as first_post_chick_fil_a_salary,
    COALESCE(v.chick_fil_a_provided_salary_lift, FALSE) as chick_fil_a_provided_salary_lift,
    COALESCE(v.achieved_six_figure_post_chick_fil_a, FALSE) as achieved_six_figure_post_chick_fil_a,
    COALESCE(v.doubled_salary_post_chick_fil_a, FALSE) as doubled_salary_post_chick_fil_a,
    COALESCE(v.moved_to_leadership_post_chick_fil_a, FALSE) as moved_to_leadership_post_chick_fil_a,
    COALESCE(v.career_level_increase_post_chick_fil_a, FALSE) as career_level_increase_post_chick_fil_a,
    COALESCE(v.undergraduate_school, ARRAY[]::TEXT[]) as undergraduate_school,
    COALESCE(v.graduate_school, ARRAY[]::TEXT[]) as graduate_school,
    COALESCE(v.high_school, ARRAY[]::TEXT[]) as high_school,
    COALESCE(v.pre_company_education, ARRAY[]::TEXT[]) as pre_company_education,
    COALESCE(v.during_company_education, ARRAY[]::TEXT[]) as during_company_education,
    COALESCE(v.post_company_education, ARRAY[]::TEXT[]) as post_company_education,
    -- PRE-COMPANY CAREER FIELDS
    COALESCE(v.pre_company_companies, ARRAY[]::TEXT[]) as pre_company_companies,
    COALESCE(v.pre_company_titles, ARRAY[]::TEXT[]) as pre_company_titles,
    COALESCE(v.pre_company_industries, ARRAY[]::TEXT[]) as pre_company_industries,
    COALESCE(v.pre_company_locations, ARRAY[]::TEXT[]) as pre_company_locations,
    -- POST-COMPANY CAREER FIELDS
    COALESCE(v.post_company_companies, ARRAY[]::TEXT[]) as post_company_companies,
    COALESCE(v.post_company_titles, ARRAY[]::TEXT[]) as post_company_titles,
    COALESCE(v.post_company_industries, ARRAY[]::TEXT[]) as post_company_industries,
    COALESCE(v.post_company_locations, ARRAY[]::TEXT[]) as post_company_locations,
    COALESCE(v.functional_expertise, ARRAY[]::TEXT[]) as functional_expertise,
    COALESCE(v.industry_expertise, ARRAY[]::TEXT[]) as industry_expertise,
    COALESCE(v.industry_transitions, ARRAY[]::TEXT[]) as industry_transitions,
    COALESCE(v.education_geography, ARRAY[]::TEXT[]) as education_geography,
    -- Additional fields
    v.chick_fil_a_exit_year,
    COALESCE(v.had_multiple_company_stints, FALSE) as had_multiple_company_stints,
    v.years_since_chick_fil_a
  FROM chick_fil_a_alumni_standard_search v
  WHERE 1=1
    -- 1. BASIC ENTITY FILTERS (searches current state first, then arrays)
    AND ((search_filters->>'company_filter') IS NULL OR 
         ((search_filters->>'company_or_logic')::boolean = FALSE AND v.post_company_current_company ILIKE '%' || (search_filters->>'company_filter') || '%') OR
         ((search_filters->>'company_or_logic')::boolean = TRUE AND (search_filters->'company_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'company_filters') = 'array' AND
          EXISTS(SELECT 1 FROM jsonb_array_elements_text(search_filters->'company_filters') AS cf WHERE v.post_company_current_company ILIKE '%' || cf || '%')))
    
    AND ((search_filters->>'industry_filter') IS NULL OR 
         ((search_filters->>'industry_or_logic')::boolean = FALSE AND v.post_company_current_industry ILIKE '%' || (search_filters->>'industry_filter') || '%') OR
         ((search_filters->>'industry_or_logic')::boolean = TRUE AND (search_filters->'industry_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'industry_filters') = 'array' AND
          EXISTS(SELECT 1 FROM jsonb_array_elements_text(search_filters->'industry_filters') AS if_val WHERE v.post_company_current_industry ILIKE '%' || if_val || '%')))
    
    AND ((search_filters->>'title_filter') IS NULL OR 
         ((search_filters->>'title_or_logic')::boolean = FALSE AND v.post_company_current_title ILIKE '%' || (search_filters->>'title_filter') || '%') OR
         ((search_filters->>'title_or_logic')::boolean = TRUE AND (search_filters->'title_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'title_filters') = 'array' AND
          EXISTS(SELECT 1 FROM jsonb_array_elements_text(search_filters->'title_filters') AS tf WHERE v.post_company_current_title ILIKE '%' || tf || '%')))
    
    AND ((search_filters->>'location_filter') IS NULL OR 
         ((search_filters->>'location_or_logic')::boolean = FALSE AND (v.post_company_current_location ILIKE '%' || (search_filters->>'location_filter') || '%' OR v.home_location ILIKE '%' || (search_filters->>'location_filter') || '%')) OR
         ((search_filters->>'location_or_logic')::boolean = TRUE AND (search_filters->'location_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'location_filters') = 'array' AND
          EXISTS(SELECT 1 FROM jsonb_array_elements_text(search_filters->'location_filters') AS lf WHERE v.post_company_current_location ILIKE '%' || lf || '%' OR v.home_location ILIKE '%' || lf || '%')))
    
    AND ((search_filters->>'school_filter') IS NULL OR 
         ((search_filters->>'school_or_logic')::boolean = FALSE AND (v.undergraduate_school && ARRAY[search_filters->>'school_filter'] OR v.graduate_school && ARRAY[search_filters->>'school_filter'])) OR
         ((search_filters->>'school_or_logic')::boolean = TRUE AND (search_filters->'school_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'school_filters') = 'array' AND
          (v.undergraduate_school && ARRAY(SELECT jsonb_array_elements_text(search_filters->'school_filters')) OR v.graduate_school && ARRAY(SELECT jsonb_array_elements_text(search_filters->'school_filters')))))
    
    -- 2. CAREER PROGRESSION & LEADERSHIP FILTERS
    AND ((search_filters->>'current_job_level_filter') IS NULL OR 
         ((search_filters->>'current_job_level_or_logic')::boolean = FALSE AND v.current_job_level ILIKE '%' || (search_filters->>'current_job_level_filter') || '%') OR
         ((search_filters->>'current_job_level_or_logic')::boolean = TRUE AND (search_filters->'current_job_level_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'current_job_level_filters') = 'array' AND
          EXISTS(SELECT 1 FROM jsonb_array_elements_text(search_filters->'current_job_level_filters') AS jlf WHERE v.current_job_level ILIKE '%' || jlf || '%')))
    
    AND ((search_filters->>'current_job_function_filter') IS NULL OR 
         ((search_filters->>'current_job_function_or_logic')::boolean = FALSE AND v.current_job_function ILIKE '%' || (search_filters->>'current_job_function_filter') || '%') OR
         ((search_filters->>'current_job_function_or_logic')::boolean = TRUE AND (search_filters->'current_job_function_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'current_job_function_filters') = 'array' AND
          EXISTS(SELECT 1 FROM jsonb_array_elements_text(search_filters->'current_job_function_filters') AS jff WHERE v.current_job_function ILIKE '%' || jff || '%')))
    
    AND ((search_filters->>'career_stage_filter') IS NULL OR v.career_stage = (search_filters->>'career_stage_filter'))
    AND ((search_filters->>'career_trajectory_filter') IS NULL OR 
         ((search_filters->>'career_trajectory_or_logic')::boolean = FALSE AND v.career_trajectory = (search_filters->>'career_trajectory_filter')) OR
         ((search_filters->>'career_trajectory_or_logic')::boolean = TRUE AND (search_filters->'career_trajectory_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'career_trajectory_filters') = 'array' AND
          v.career_trajectory = ANY(ARRAY(SELECT jsonb_array_elements_text(search_filters->'career_trajectory_filters')))))
    
    AND ((search_filters->>'is_current_leader')::boolean = FALSE OR v.is_current_leader = TRUE)
    AND ((search_filters->>'management_experience')::boolean = FALSE OR v.management_experience = TRUE)
    AND ((search_filters->>'revenue_responsibility')::boolean = FALSE OR v.revenue_responsibility = TRUE)
    
    -- 3. COMPANY & INDUSTRY INTELLIGENCE
    AND ((search_filters->>'current_company_size_category_filter') IS NULL OR 
         ((search_filters->>'current_company_size_category_or_logic')::boolean = FALSE AND v.current_company_size_category = (search_filters->>'current_company_size_category_filter')) OR
         ((search_filters->>'current_company_size_category_or_logic')::boolean = TRUE AND (search_filters->'current_company_size_category_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'current_company_size_category_filters') = 'array' AND
          v.current_company_size_category = ANY(ARRAY(SELECT jsonb_array_elements_text(search_filters->'current_company_size_category_filters')))))
    
    AND ((search_filters->>'has_startup_experience')::boolean = FALSE OR v.has_startup_experience = TRUE)
    AND ((search_filters->>'has_enterprise_experience')::boolean = FALSE OR v.has_enterprise_experience = TRUE)
    AND ((search_filters->'industry_transitions_filter') IS NULL OR 
         jsonb_typeof(search_filters->'industry_transitions_filter') = 'array' AND
         v.industry_transitions && ARRAY(SELECT jsonb_array_elements_text(search_filters->'industry_transitions_filter')))
    
    -- 4. SKILLS & EXPERIENCE PATTERNS
    AND ((search_filters->>'technical_background')::boolean = FALSE OR v.technical_background = TRUE)
    AND ((search_filters->>'sales_experience')::boolean = FALSE OR v.sales_experience = TRUE)
    AND ((search_filters->>'consulting_experience')::boolean = FALSE OR v.consulting_experience = TRUE)
    AND ((search_filters->>'restaurant_operations_experience')::boolean = FALSE OR v.restaurant_operations_experience = TRUE)
    AND ((search_filters->>'is_remote_worker')::boolean = FALSE OR v.is_remote_worker = TRUE)
    
    AND ((search_filters->'functional_expertise_filter') IS NULL OR 
         jsonb_typeof(search_filters->'functional_expertise_filter') = 'array' AND
         v.functional_expertise && ARRAY(SELECT jsonb_array_elements_text(search_filters->'functional_expertise_filter')))
    AND ((search_filters->'industry_expertise_filter') IS NULL OR 
         jsonb_typeof(search_filters->'industry_expertise_filter') = 'array' AND
         v.industry_expertise && ARRAY(SELECT jsonb_array_elements_text(search_filters->'industry_expertise_filter')))
    
    -- 5. EDUCATIONAL BACKGROUND & CONTEXT
    AND ((search_filters->>'highest_degree_level_filter') IS NULL OR 
         ((search_filters->>'highest_degree_level_or_logic')::boolean = FALSE AND v.highest_degree_level = (search_filters->>'highest_degree_level_filter')) OR
         ((search_filters->>'highest_degree_level_or_logic')::boolean = TRUE AND (search_filters->'highest_degree_level_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'highest_degree_level_filters') = 'array' AND
          v.highest_degree_level = ANY(ARRAY(SELECT jsonb_array_elements_text(search_filters->'highest_degree_level_filters')))))
    
    AND ((search_filters->>'school_ranking_tier_filter') IS NULL OR 
         ((search_filters->>'school_ranking_tier_or_logic')::boolean = FALSE AND v.school_ranking_tier = (search_filters->>'school_ranking_tier_filter')) OR
         ((search_filters->>'school_ranking_tier_or_logic')::boolean = TRUE AND (search_filters->'school_ranking_tier_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'school_ranking_tier_filters') = 'array' AND
          v.school_ranking_tier = ANY(ARRAY(SELECT jsonb_array_elements_text(search_filters->'school_ranking_tier_filters')))))
    
    AND ((search_filters->>'major_category_filter') IS NULL OR 
         ((search_filters->>'major_category_or_logic')::boolean = FALSE AND v.major_category = (search_filters->>'major_category_filter')) OR
         ((search_filters->>'major_category_or_logic')::boolean = TRUE AND (search_filters->'major_category_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'major_category_filters') = 'array' AND
          v.major_category = ANY(ARRAY(SELECT jsonb_array_elements_text(search_filters->'major_category_filters')))))
    
    AND ((search_filters->>'undergraduate_major_filter') IS NULL OR 
         ((search_filters->>'undergraduate_major_or_logic')::boolean = FALSE AND v.undergraduate_major ILIKE '%' || (search_filters->>'undergraduate_major_filter') || '%') OR
         ((search_filters->>'undergraduate_major_or_logic')::boolean = TRUE AND (search_filters->'undergraduate_major_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'undergraduate_major_filters') = 'array' AND
          EXISTS(SELECT 1 FROM jsonb_array_elements_text(search_filters->'undergraduate_major_filters') AS umf WHERE v.undergraduate_major ILIKE '%' || umf || '%')))
    
    AND ((search_filters->>'graduate_specialization_filter') IS NULL OR 
         ((search_filters->>'graduate_specialization_or_logic')::boolean = FALSE AND v.graduate_specialization ILIKE '%' || (search_filters->>'graduate_specialization_filter') || '%') OR
         ((search_filters->>'graduate_specialization_or_logic')::boolean = TRUE AND (search_filters->'graduate_specialization_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'graduate_specialization_filters') = 'array' AND
          EXISTS(SELECT 1 FROM jsonb_array_elements_text(search_filters->'graduate_specialization_filters') AS gsf WHERE v.graduate_specialization ILIKE '%' || gsf || '%')))
    
    AND ((search_filters->>'stem_education')::boolean = FALSE OR v.stem_education = TRUE)
    AND ((search_filters->>'business_education')::boolean = FALSE OR v.business_education = TRUE)
    AND ((search_filters->>'elite_education')::boolean = FALSE OR v.elite_education = TRUE)
    AND ((search_filters->>'continued_education')::boolean = FALSE OR v.continued_education = TRUE)
    AND ((search_filters->>'executive_education')::boolean = FALSE OR v.executive_education = TRUE)
    AND ((search_filters->>'technical_certifications')::boolean = FALSE OR v.technical_certifications = TRUE)
    
    -- 6. ENHANCED SEARCH CATEGORIES
    AND ((search_filters->>'mentor_potential')::boolean = FALSE OR v.mentor_potential = TRUE)
    AND ((search_filters->>'likely_job_seeking')::boolean = FALSE OR v.likely_job_seeking = TRUE)
    AND ((search_filters->>'total_positions_min')::integer IS NULL OR v.total_positions_count >= (search_filters->>'total_positions_min')::integer)
    AND ((search_filters->>'total_positions_max')::integer IS NULL OR v.total_positions_count <= (search_filters->>'total_positions_max')::integer)
    AND ((search_filters->>'average_tenure_min_months')::integer IS NULL OR v.average_tenure_months >= (search_filters->>'average_tenure_min_months')::integer)
    AND ((search_filters->>'average_tenure_max_months')::integer IS NULL OR v.average_tenure_months <= (search_filters->>'average_tenure_max_months')::integer)
    
    -- 7. COMPANY IMPACT METRICS
    AND ((search_filters->>'company_provided_salary_lift')::boolean = FALSE OR v.chick_fil_a_provided_salary_lift = TRUE)
    AND ((search_filters->>'achieved_six_figure_post_company')::boolean = FALSE OR v.achieved_six_figure_post_chick_fil_a = TRUE)
    AND ((search_filters->>'doubled_salary_post_company')::boolean = FALSE OR v.doubled_salary_post_chick_fil_a = TRUE)
    AND ((search_filters->>'moved_to_leadership_post_company')::boolean = FALSE OR v.moved_to_leadership_post_chick_fil_a = TRUE)
    AND ((search_filters->>'career_level_increase_post_company')::boolean = FALSE OR v.career_level_increase_post_chick_fil_a = TRUE)
    
    -- 8. GEOGRAPHIC & LOCATION (additional to basic location filters above)
    AND ((search_filters->>'home_location_filter') IS NULL OR 
         ((search_filters->>'home_location_or_logic')::boolean = FALSE AND v.home_location ILIKE '%' || (search_filters->>'home_location_filter') || '%') OR
         ((search_filters->>'home_location_or_logic')::boolean = TRUE AND (search_filters->'home_location_filters') IS NOT NULL AND 
          jsonb_typeof(search_filters->'home_location_filters') = 'array' AND
          EXISTS(SELECT 1 FROM jsonb_array_elements_text(search_filters->'home_location_filters') AS hlf WHERE v.home_location ILIKE '%' || hlf || '%')))
    
    AND ((search_filters->'education_geography_filter') IS NULL OR 
         jsonb_typeof(search_filters->'education_geography_filter') = 'array' AND
         v.education_geography && ARRAY(SELECT jsonb_array_elements_text(search_filters->'education_geography_filter')))
    
    -- 9. SALARY ANALYSIS FIELDS (including new salary fields)
    AND ((search_filters->>'min_current_salary')::decimal IS NULL OR v.current_estimated_salary >= (search_filters->>'min_current_salary')::decimal)
    AND ((search_filters->>'max_current_salary')::decimal IS NULL OR v.current_estimated_salary <= (search_filters->>'max_current_salary')::decimal)
    AND ((search_filters->>'min_highest_career_salary')::decimal IS NULL OR v.highest_career_salary >= (search_filters->>'min_highest_career_salary')::decimal)
    AND ((search_filters->>'max_highest_career_salary')::decimal IS NULL OR v.highest_career_salary <= (search_filters->>'max_highest_career_salary')::decimal)
    AND ((search_filters->>'min_pre_chick_fil_a_salary')::decimal IS NULL OR v.pre_chick_fil_a_salary >= (search_filters->>'min_pre_chick_fil_a_salary')::decimal)
    AND ((search_filters->>'min_first_post_chick_fil_a_salary')::decimal IS NULL OR v.first_post_chick_fil_a_salary >= (search_filters->>'min_first_post_chick_fil_a_salary')::decimal)
    AND ((search_filters->>'salary_growth_indicator')::boolean = FALSE OR v.chick_fil_a_provided_salary_lift = TRUE OR v.achieved_six_figure_post_chick_fil_a = TRUE)
    
    -- NEW: MATHEMATICAL SALARY COMPARISONS
    -- Compare post-company salary vs pre-company salary
    AND ((search_filters->>'post_salary_greater_than_pre')::boolean = FALSE OR 
         (v.first_post_chick_fil_a_salary > 0 AND v.pre_chick_fil_a_salary > 0 AND v.first_post_chick_fil_a_salary > v.pre_chick_fil_a_salary))
    
    -- Current salary greater than first post-company salary (continued growth)
    AND ((search_filters->>'current_salary_greater_than_first_post')::boolean = FALSE OR 
         (v.current_estimated_salary > 0 AND v.first_post_chick_fil_a_salary > 0 AND v.current_estimated_salary > v.first_post_chick_fil_a_salary))
    
    -- Minimum salary growth percentage from pre to post company
    AND ((search_filters->>'min_salary_growth_percentage')::decimal IS NULL OR 
         (v.first_post_chick_fil_a_salary > 0 AND v.pre_chick_fil_a_salary > 0 AND 
          ((v.first_post_chick_fil_a_salary - v.pre_chick_fil_a_salary) / v.pre_chick_fil_a_salary * 100) >= (search_filters->>'min_salary_growth_percentage')::decimal))
    
    -- Maximum salary growth percentage (to find modest increases)
    AND ((search_filters->>'max_salary_growth_percentage')::decimal IS NULL OR 
         (v.first_post_chick_fil_a_salary > 0 AND v.pre_chick_fil_a_salary > 0 AND 
          ((v.first_post_chick_fil_a_salary - v.pre_chick_fil_a_salary) / v.pre_chick_fil_a_salary * 100) <= (search_filters->>'max_salary_growth_percentage')::decimal))
    
    -- Absolute salary increase amount (dollar amount increase)
    AND ((search_filters->>'min_salary_increase_amount')::decimal IS NULL OR 
         (v.first_post_chick_fil_a_salary > 0 AND v.pre_chick_fil_a_salary > 0 AND 
          (v.first_post_chick_fil_a_salary - v.pre_chick_fil_a_salary) >= (search_filters->>'min_salary_increase_amount')::decimal))
    
    -- Salary multiplier (e.g., "doubled" = 2.0, "tripled" = 3.0)
    AND ((search_filters->>'min_salary_multiplier')::decimal IS NULL OR 
         (v.first_post_chick_fil_a_salary > 0 AND v.pre_chick_fil_a_salary > 0 AND 
          (v.first_post_chick_fil_a_salary / v.pre_chick_fil_a_salary) >= (search_filters->>'min_salary_multiplier')::decimal))
    
    -- Career peak salary comparison to current
    AND ((search_filters->>'current_salary_near_peak')::boolean = FALSE OR 
         (v.current_estimated_salary > 0 AND v.highest_career_salary > 0 AND 
          v.current_estimated_salary >= (v.highest_career_salary * 0.9))) -- Within 90% of peak
    
    -- Salary range comparisons (fixed: check if the field is an array before accessing elements)
    AND ((search_filters->'salary_range_pre_company') IS NULL OR 
         jsonb_typeof(search_filters->'salary_range_pre_company') != 'array' OR
         (v.pre_chick_fil_a_salary >= (search_filters->'salary_range_pre_company'->0)::decimal AND 
          v.pre_chick_fil_a_salary <= (search_filters->'salary_range_pre_company'->1)::decimal))
    
    AND ((search_filters->'salary_range_post_company') IS NULL OR 
         jsonb_typeof(search_filters->'salary_range_post_company') != 'array' OR
         (v.first_post_chick_fil_a_salary >= (search_filters->'salary_range_post_company'->0)::decimal AND 
          v.first_post_chick_fil_a_salary <= (search_filters->'salary_range_post_company'->1)::decimal))
    
    -- 10. COMPREHENSIVE ARRAY FIELDS FOR CAREER TRACKING (PRE + POST COMPANY)
    -- PRE-COMPANY FILTERS (Background/Network Analysis)
    AND ((search_filters->'pre_company_companies_filter') IS NULL OR 
         jsonb_typeof(search_filters->'pre_company_companies_filter') = 'array' AND
         v.pre_company_companies && ARRAY(SELECT jsonb_array_elements_text(search_filters->'pre_company_companies_filter')))
    AND ((search_filters->'pre_company_titles_filter') IS NULL OR 
         jsonb_typeof(search_filters->'pre_company_titles_filter') = 'array' AND
         v.pre_company_titles && ARRAY(SELECT jsonb_array_elements_text(search_filters->'pre_company_titles_filter')))
    AND ((search_filters->'pre_company_industries_filter') IS NULL OR 
         jsonb_typeof(search_filters->'pre_company_industries_filter') = 'array' AND
         v.pre_company_industries && ARRAY(SELECT jsonb_array_elements_text(search_filters->'pre_company_industries_filter')))
    AND ((search_filters->'pre_company_locations_filter') IS NULL OR 
         jsonb_typeof(search_filters->'pre_company_locations_filter') = 'array' AND
         v.pre_company_locations && ARRAY(SELECT jsonb_array_elements_text(search_filters->'pre_company_locations_filter')))
    
    -- POST-COMPANY FILTERS (Current/Recent Career Path)
    AND ((search_filters->'post_company_companies_filter') IS NULL OR 
         jsonb_typeof(search_filters->'post_company_companies_filter') = 'array' AND
         v.post_company_companies && ARRAY(SELECT jsonb_array_elements_text(search_filters->'post_company_companies_filter')))
    AND ((search_filters->'post_company_titles_filter') IS NULL OR 
         jsonb_typeof(search_filters->'post_company_titles_filter') = 'array' AND
         v.post_company_titles && ARRAY(SELECT jsonb_array_elements_text(search_filters->'post_company_titles_filter')))
    AND ((search_filters->'post_company_industries_filter') IS NULL OR 
         jsonb_typeof(search_filters->'post_company_industries_filter') = 'array' AND
         v.post_company_industries && ARRAY(SELECT jsonb_array_elements_text(search_filters->'post_company_industries_filter')))
    AND ((search_filters->'post_company_locations_filter') IS NULL OR 
         jsonb_typeof(search_filters->'post_company_locations_filter') = 'array' AND
         v.post_company_locations && ARRAY(SELECT jsonb_array_elements_text(search_filters->'post_company_locations_filter')))
    
    -- EDUCATION FILTERS
    AND ((search_filters->'undergraduate_schools_filter') IS NULL OR 
         jsonb_typeof(search_filters->'undergraduate_schools_filter') = 'array' AND
         v.undergraduate_school && ARRAY(SELECT jsonb_array_elements_text(search_filters->'undergraduate_schools_filter')))
    AND ((search_filters->'graduate_schools_filter') IS NULL OR 
         jsonb_typeof(search_filters->'graduate_schools_filter') = 'array' AND
         v.graduate_school && ARRAY(SELECT jsonb_array_elements_text(search_filters->'graduate_schools_filter')))
    
    -- Optional: Text search in natural language fields if search_query is provided
    AND (search_query IS NULL OR 
         v.name ILIKE '%' || search_query || '%' OR
         v.post_company_current_title ILIKE '%' || search_query || '%' OR
         v.post_company_current_company ILIKE '%' || search_query || '%')
    
  ORDER BY 
    -- Prioritize exact matches, then partial matches
    CASE 
      WHEN search_query IS NOT NULL AND v.name ILIKE search_query THEN 1
      WHEN search_query IS NOT NULL AND v.post_company_current_title ILIKE search_query THEN 2
      WHEN search_query IS NOT NULL AND v.post_company_current_company ILIKE search_query THEN 3
      ELSE 4
    END,
    -- Secondary ordering by salary and name
    v.current_estimated_salary DESC NULLS LAST,
    v.name ASC
  
  LIMIT limit_count;
END;
$$;