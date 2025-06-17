-- Create the comprehensive standard search function with all enhanced filtering capabilities
CREATE OR REPLACE FUNCTION comprehensive_standard_search_chick_fil_a(
  -- 1. BASIC ENTITY FILTERS
  company_filter TEXT DEFAULT NULL,
  company_filters TEXT[] DEFAULT NULL,
  company_or_logic BOOLEAN DEFAULT FALSE,
  
  industry_filter TEXT DEFAULT NULL,
  industry_filters TEXT[] DEFAULT NULL,
  industry_or_logic BOOLEAN DEFAULT FALSE,
  
  title_filter TEXT DEFAULT NULL,
  title_filters TEXT[] DEFAULT NULL,
  title_or_logic BOOLEAN DEFAULT FALSE,
  
  location_filter TEXT DEFAULT NULL,
  location_filters TEXT[] DEFAULT NULL,
  location_or_logic BOOLEAN DEFAULT FALSE,
  
  school_filter TEXT DEFAULT NULL,
  school_filters TEXT[] DEFAULT NULL,
  school_or_logic BOOLEAN DEFAULT FALSE,
  
  -- 2. CAREER PROGRESSION & LEADERSHIP FILTERS
  current_job_level_filter TEXT DEFAULT NULL,
  current_job_level_filters TEXT[] DEFAULT NULL,
  current_job_level_or_logic BOOLEAN DEFAULT FALSE,
  
  current_job_function_filter TEXT DEFAULT NULL,
  current_job_function_filters TEXT[] DEFAULT NULL,
  current_job_function_or_logic BOOLEAN DEFAULT FALSE,
  
  career_stage_filter TEXT DEFAULT NULL,
  career_trajectory_filter TEXT DEFAULT NULL,
  career_trajectory_filters TEXT[] DEFAULT NULL,
  career_trajectory_or_logic BOOLEAN DEFAULT FALSE,
  
  is_current_leader BOOLEAN DEFAULT FALSE,
  management_experience BOOLEAN DEFAULT FALSE,
  revenue_responsibility BOOLEAN DEFAULT FALSE,
  
  -- 3. COMPANY & INDUSTRY INTELLIGENCE
  current_company_size_category_filter TEXT DEFAULT NULL,
  current_company_size_category_filters TEXT[] DEFAULT NULL,
  current_company_size_category_or_logic BOOLEAN DEFAULT FALSE,
  
  has_startup_experience BOOLEAN DEFAULT FALSE,
  has_enterprise_experience BOOLEAN DEFAULT FALSE,
  industry_transitions_filter TEXT[] DEFAULT NULL,
  
  -- 4. SKILLS & EXPERIENCE PATTERNS
  technical_background BOOLEAN DEFAULT FALSE,
  sales_experience BOOLEAN DEFAULT FALSE,
  consulting_experience BOOLEAN DEFAULT FALSE,
  restaurant_operations_experience BOOLEAN DEFAULT FALSE,
  is_remote_worker BOOLEAN DEFAULT FALSE,
  
  functional_expertise_filter TEXT[] DEFAULT NULL,
  functional_expertise_or_logic BOOLEAN DEFAULT FALSE,
  
  industry_expertise_filter TEXT[] DEFAULT NULL,
  industry_expertise_or_logic BOOLEAN DEFAULT FALSE,
  
  -- 5. EDUCATIONAL BACKGROUND & CONTEXT
  highest_degree_level_filter TEXT DEFAULT NULL,
  highest_degree_level_filters TEXT[] DEFAULT NULL,
  highest_degree_level_or_logic BOOLEAN DEFAULT FALSE,
  
  school_ranking_tier_filter TEXT DEFAULT NULL,
  school_ranking_tier_filters TEXT[] DEFAULT NULL,
  school_ranking_tier_or_logic BOOLEAN DEFAULT FALSE,
  
  major_category_filter TEXT DEFAULT NULL,
  major_category_filters TEXT[] DEFAULT NULL,
  major_category_or_logic BOOLEAN DEFAULT FALSE,
  
  undergraduate_major_filter TEXT DEFAULT NULL,
  undergraduate_major_filters TEXT[] DEFAULT NULL,
  undergraduate_major_or_logic BOOLEAN DEFAULT FALSE,
  
  graduate_specialization_filter TEXT DEFAULT NULL,
  graduate_specialization_filters TEXT[] DEFAULT NULL,
  graduate_specialization_or_logic BOOLEAN DEFAULT FALSE,
  
  stem_education BOOLEAN DEFAULT FALSE,
  business_education BOOLEAN DEFAULT FALSE,
  elite_education BOOLEAN DEFAULT FALSE,
  continued_education BOOLEAN DEFAULT FALSE,
  executive_education BOOLEAN DEFAULT FALSE,
  technical_certifications BOOLEAN DEFAULT FALSE,
  
  -- 6. ENHANCED SEARCH CATEGORIES
  mentor_potential BOOLEAN DEFAULT FALSE,
  likely_job_seeking BOOLEAN DEFAULT FALSE,
  total_positions_min INTEGER DEFAULT NULL,
  total_positions_max INTEGER DEFAULT NULL,
  average_tenure_min_months INTEGER DEFAULT NULL,
  average_tenure_max_months INTEGER DEFAULT NULL,
  
  -- 7. COMPANY IMPACT METRICS (Organization-specific)
  company_provided_salary_lift BOOLEAN DEFAULT FALSE,
  achieved_six_figure_post_company BOOLEAN DEFAULT FALSE,
  doubled_salary_post_company BOOLEAN DEFAULT FALSE,
  moved_to_leadership_post_company BOOLEAN DEFAULT FALSE,
  career_level_increase_post_company BOOLEAN DEFAULT FALSE,
  
  -- 8. GEOGRAPHIC & LOCATION
  home_location_filter TEXT DEFAULT NULL,
  home_location_filters TEXT[] DEFAULT NULL,
  home_location_or_logic BOOLEAN DEFAULT FALSE,
  
  education_geography_filter TEXT[] DEFAULT NULL,
  education_geography_or_logic BOOLEAN DEFAULT FALSE,
  
  -- 9. SALARY ANALYSIS FIELDS
  min_current_salary DECIMAL DEFAULT NULL,
  max_current_salary DECIMAL DEFAULT NULL,
  min_highest_career_salary DECIMAL DEFAULT NULL,
  max_highest_career_salary DECIMAL DEFAULT NULL,
  salary_growth_indicator BOOLEAN DEFAULT FALSE,
  
  -- 10. ARRAY FIELDS FOR COMPREHENSIVE SEARCH (OR Logic)
  post_company_companies_filter TEXT[] DEFAULT NULL,
  post_company_companies_or_logic BOOLEAN DEFAULT FALSE,
  
  post_company_titles_filter TEXT[] DEFAULT NULL,
  post_company_titles_or_logic BOOLEAN DEFAULT FALSE,
  
  post_company_industries_filter TEXT[] DEFAULT NULL,
  post_company_industries_or_logic BOOLEAN DEFAULT FALSE,
  
  pre_company_companies_filter TEXT[] DEFAULT NULL,
  pre_company_companies_or_logic BOOLEAN DEFAULT FALSE,
  
  pre_company_titles_filter TEXT[] DEFAULT NULL,
  pre_company_titles_or_logic BOOLEAN DEFAULT FALSE,
  
  undergraduate_schools_filter TEXT[] DEFAULT NULL,
  undergraduate_schools_or_logic BOOLEAN DEFAULT FALSE,
  
  graduate_schools_filter TEXT[] DEFAULT NULL,
  graduate_schools_or_logic BOOLEAN DEFAULT FALSE,
  
  -- Query parameters
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
  post_company_companies TEXT[],
  post_company_titles TEXT[],
  post_company_industries TEXT[],
  post_company_locations TEXT[],
  pre_company_companies TEXT[],
  pre_company_titles TEXT[],
  pre_company_industries TEXT[],
  pre_company_locations TEXT[],
  functional_expertise TEXT[],
  industry_expertise TEXT[],
  industry_transitions TEXT[],
  education_geography TEXT[]
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
    COALESCE(v.post_company_companies, ARRAY[]::TEXT[]) as post_company_companies,
    COALESCE(v.post_company_titles, ARRAY[]::TEXT[]) as post_company_titles,
    COALESCE(v.post_company_industries, ARRAY[]::TEXT[]) as post_company_industries,
    COALESCE(v.post_company_locations, ARRAY[]::TEXT[]) as post_company_locations,
    COALESCE(v.pre_company_companies, ARRAY[]::TEXT[]) as pre_company_companies,
    COALESCE(v.pre_company_titles, ARRAY[]::TEXT[]) as pre_company_titles,
    COALESCE(v.pre_company_industries, ARRAY[]::TEXT[]) as pre_company_industries,
    COALESCE(v.pre_company_locations, ARRAY[]::TEXT[]) as pre_company_locations,
    COALESCE(v.functional_expertise, ARRAY[]::TEXT[]) as functional_expertise,
    COALESCE(v.industry_expertise, ARRAY[]::TEXT[]) as industry_expertise,
    COALESCE(v.industry_transitions, ARRAY[]::TEXT[]) as industry_transitions,
    COALESCE(v.education_geography, ARRAY[]::TEXT[]) as education_geography
  FROM chick_fil_a_alumni_vector v
  WHERE 1=1
    -- 1. BASIC ENTITY FILTERS
    AND (company_filter IS NULL OR 
         (company_or_logic = FALSE AND v.post_company_current_company ILIKE '%' || company_filter || '%') OR
         (company_or_logic = TRUE AND company_filters IS NOT NULL AND 
          EXISTS(SELECT 1 FROM unnest(company_filters) AS cf WHERE v.post_company_current_company ILIKE '%' || cf || '%')))
    
    AND (industry_filter IS NULL OR 
         (industry_or_logic = FALSE AND v.post_company_current_industry ILIKE '%' || industry_filter || '%') OR
         (industry_or_logic = TRUE AND industry_filters IS NOT NULL AND 
          EXISTS(SELECT 1 FROM unnest(industry_filters) AS if_val WHERE v.post_company_current_industry ILIKE '%' || if_val || '%')))
    
    AND (title_filter IS NULL OR 
         (title_or_logic = FALSE AND v.post_company_current_title ILIKE '%' || title_filter || '%') OR
         (title_or_logic = TRUE AND title_filters IS NOT NULL AND 
          EXISTS(SELECT 1 FROM unnest(title_filters) AS tf WHERE v.post_company_current_title ILIKE '%' || tf || '%')))
    
    AND (location_filter IS NULL OR 
         (location_or_logic = FALSE AND (v.post_company_current_location ILIKE '%' || location_filter || '%' OR v.home_location ILIKE '%' || location_filter || '%')) OR
         (location_or_logic = TRUE AND location_filters IS NOT NULL AND 
          EXISTS(SELECT 1 FROM unnest(location_filters) AS lf WHERE v.post_company_current_location ILIKE '%' || lf || '%' OR v.home_location ILIKE '%' || lf || '%')))
    
    AND (school_filter IS NULL OR 
         (school_or_logic = FALSE AND (v.undergraduate_school && ARRAY[school_filter] OR v.graduate_school && ARRAY[school_filter])) OR
         (school_or_logic = TRUE AND school_filters IS NOT NULL AND 
          (v.undergraduate_school && school_filters OR v.graduate_school && school_filters)))
    
    -- 2. CAREER PROGRESSION & LEADERSHIP FILTERS
    AND (current_job_level_filter IS NULL OR 
         (current_job_level_or_logic = FALSE AND v.current_job_level ILIKE '%' || current_job_level_filter || '%') OR
         (current_job_level_or_logic = TRUE AND current_job_level_filters IS NOT NULL AND 
          EXISTS(SELECT 1 FROM unnest(current_job_level_filters) AS jlf WHERE v.current_job_level ILIKE '%' || jlf || '%')))
    
    AND (current_job_function_filter IS NULL OR 
         (current_job_function_or_logic = FALSE AND v.current_job_function ILIKE '%' || current_job_function_filter || '%') OR
         (current_job_function_or_logic = TRUE AND current_job_function_filters IS NOT NULL AND 
          EXISTS(SELECT 1 FROM unnest(current_job_function_filters) AS jff WHERE v.current_job_function ILIKE '%' || jff || '%')))
    
    AND (career_stage_filter IS NULL OR v.career_stage = career_stage_filter)
    AND (career_trajectory_filter IS NULL OR 
         (career_trajectory_or_logic = FALSE AND v.career_trajectory = career_trajectory_filter) OR
         (career_trajectory_or_logic = TRUE AND career_trajectory_filters IS NOT NULL AND v.career_trajectory = ANY(career_trajectory_filters)))
    
    AND (is_current_leader = FALSE OR v.is_current_leader = TRUE)
    AND (management_experience = FALSE OR v.management_experience = TRUE)
    AND (revenue_responsibility = FALSE OR v.revenue_responsibility = TRUE)
    
    -- 3. COMPANY & INDUSTRY INTELLIGENCE
    AND (current_company_size_category_filter IS NULL OR 
         (current_company_size_category_or_logic = FALSE AND v.current_company_size_category = current_company_size_category_filter) OR
         (current_company_size_category_or_logic = TRUE AND current_company_size_category_filters IS NOT NULL AND v.current_company_size_category = ANY(current_company_size_category_filters)))
    
    AND (has_startup_experience = FALSE OR v.has_startup_experience = TRUE)
    AND (has_enterprise_experience = FALSE OR v.has_enterprise_experience = TRUE)
    AND (industry_transitions_filter IS NULL OR v.industry_transitions && industry_transitions_filter)
    
    -- 4. SKILLS & EXPERIENCE PATTERNS
    AND (technical_background = FALSE OR v.technical_background = TRUE)
    AND (sales_experience = FALSE OR v.sales_experience = TRUE)
    AND (consulting_experience = FALSE OR v.consulting_experience = TRUE)
    AND (restaurant_operations_experience = FALSE OR v.restaurant_operations_experience = TRUE)
    AND (is_remote_worker = FALSE OR v.is_remote_worker = TRUE)
    
    AND (functional_expertise_filter IS NULL OR v.functional_expertise && functional_expertise_filter)
    AND (industry_expertise_filter IS NULL OR v.industry_expertise && industry_expertise_filter)
    
    -- 5. EDUCATIONAL BACKGROUND & CONTEXT
    AND (highest_degree_level_filter IS NULL OR 
         (highest_degree_level_or_logic = FALSE AND v.highest_degree_level = highest_degree_level_filter) OR
         (highest_degree_level_or_logic = TRUE AND highest_degree_level_filters IS NOT NULL AND v.highest_degree_level = ANY(highest_degree_level_filters)))
    
    AND (school_ranking_tier_filter IS NULL OR 
         (school_ranking_tier_or_logic = FALSE AND v.school_ranking_tier = school_ranking_tier_filter) OR
         (school_ranking_tier_or_logic = TRUE AND school_ranking_tier_filters IS NOT NULL AND v.school_ranking_tier = ANY(school_ranking_tier_filters)))
    
    AND (major_category_filter IS NULL OR 
         (major_category_or_logic = FALSE AND v.major_category = major_category_filter) OR
         (major_category_or_logic = TRUE AND major_category_filters IS NOT NULL AND v.major_category = ANY(major_category_filters)))
    
    AND (undergraduate_major_filter IS NULL OR 
         (undergraduate_major_or_logic = FALSE AND v.undergraduate_major ILIKE '%' || undergraduate_major_filter || '%') OR
         (undergraduate_major_or_logic = TRUE AND undergraduate_major_filters IS NOT NULL AND 
          EXISTS(SELECT 1 FROM unnest(undergraduate_major_filters) AS umf WHERE v.undergraduate_major ILIKE '%' || umf || '%')))
    
    AND (graduate_specialization_filter IS NULL OR 
         (graduate_specialization_or_logic = FALSE AND v.graduate_specialization ILIKE '%' || graduate_specialization_filter || '%') OR
         (graduate_specialization_or_logic = TRUE AND graduate_specialization_filters IS NOT NULL AND 
          EXISTS(SELECT 1 FROM unnest(graduate_specialization_filters) AS gsf WHERE v.graduate_specialization ILIKE '%' || gsf || '%')))
    
    AND (stem_education = FALSE OR v.stem_education = TRUE)
    AND (business_education = FALSE OR v.business_education = TRUE)
    AND (elite_education = FALSE OR v.elite_education = TRUE)
    AND (continued_education = FALSE OR v.continued_education = TRUE)
    AND (executive_education = FALSE OR v.executive_education = TRUE)
    AND (technical_certifications = FALSE OR v.technical_certifications = TRUE)
    
    -- 6. ENHANCED SEARCH CATEGORIES
    AND (mentor_potential = FALSE OR v.mentor_potential = TRUE)
    AND (likely_job_seeking = FALSE OR v.likely_job_seeking = TRUE)
    AND (total_positions_min IS NULL OR v.total_positions_count >= total_positions_min)
    AND (total_positions_max IS NULL OR v.total_positions_count <= total_positions_max)
    AND (average_tenure_min_months IS NULL OR v.average_tenure_months >= average_tenure_min_months)
    AND (average_tenure_max_months IS NULL OR v.average_tenure_months <= average_tenure_max_months)
    
    -- 7. COMPANY IMPACT METRICS
    AND (company_provided_salary_lift = FALSE OR v.chick_fil_a_provided_salary_lift = TRUE)
    AND (achieved_six_figure_post_company = FALSE OR v.achieved_six_figure_post_chick_fil_a = TRUE)
    AND (doubled_salary_post_company = FALSE OR v.doubled_salary_post_chick_fil_a = TRUE)
    AND (moved_to_leadership_post_company = FALSE OR v.moved_to_leadership_post_chick_fil_a = TRUE)
    AND (career_level_increase_post_company = FALSE OR v.career_level_increase_post_chick_fil_a = TRUE)
    
    -- 8. GEOGRAPHIC & LOCATION (additional to basic location filters above)
    AND (home_location_filter IS NULL OR 
         (home_location_or_logic = FALSE AND v.home_location ILIKE '%' || home_location_filter || '%') OR
         (home_location_or_logic = TRUE AND home_location_filters IS NOT NULL AND 
          EXISTS(SELECT 1 FROM unnest(home_location_filters) AS hlf WHERE v.home_location ILIKE '%' || hlf || '%')))
    
    AND (education_geography_filter IS NULL OR v.education_geography && education_geography_filter)
    
    -- 9. SALARY ANALYSIS FIELDS
    AND (min_current_salary IS NULL OR v.current_estimated_salary >= min_current_salary)
    AND (max_current_salary IS NULL OR v.current_estimated_salary <= max_current_salary)
    AND (min_highest_career_salary IS NULL OR v.highest_career_salary >= min_highest_career_salary)
    AND (max_highest_career_salary IS NULL OR v.highest_career_salary <= max_highest_career_salary)
    AND (salary_growth_indicator = FALSE OR v.chick_fil_a_provided_salary_lift = TRUE OR v.achieved_six_figure_post_chick_fil_a = TRUE)
    
    -- 10. ARRAY FIELDS FOR COMPREHENSIVE SEARCH
    AND (post_company_companies_filter IS NULL OR v.post_company_companies && post_company_companies_filter)
    AND (post_company_titles_filter IS NULL OR v.post_company_titles && post_company_titles_filter)
    AND (post_company_industries_filter IS NULL OR v.post_company_industries && post_company_industries_filter)
    AND (pre_company_companies_filter IS NULL OR v.pre_company_companies && pre_company_companies_filter)
    AND (pre_company_titles_filter IS NULL OR v.pre_company_titles && pre_company_titles_filter)
    AND (undergraduate_schools_filter IS NULL OR v.undergraduate_school && undergraduate_schools_filter)
    AND (graduate_schools_filter IS NULL OR v.graduate_school && graduate_schools_filter)
    
    -- Optional: Text search in natural language fields if search_query is provided
    AND (search_query IS NULL OR 
         v.natural_language_experiences ILIKE '%' || search_query || '%' OR 
         v.natural_language_education ILIKE '%' || search_query || '%' OR
         v.name ILIKE '%' || search_query || '%')
  
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