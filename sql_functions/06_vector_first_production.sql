-- =====================================================
-- VECTOR-FIRST PRODUCTION FUNCTION
-- =====================================================
-- This replaces your current enhanced_hybrid_search_chick_fil_a with a vector-first approach
-- that should prevent timeouts by using the vector index effectively

-- Drop the existing function
DROP FUNCTION IF EXISTS enhanced_hybrid_search_chick_fil_a;

-- Create the vector-first version
CREATE OR REPLACE FUNCTION enhanced_hybrid_search_chick_fil_a(
    query_embedding vector(1536),
    similarity_threshold double precision DEFAULT 0.3,
    company_filter text DEFAULT NULL,
    industry_filter text DEFAULT NULL,
    title_filter text DEFAULT NULL,
    location_filter text DEFAULT NULL,
    school_filter text DEFAULT NULL,
    job_level_filter text DEFAULT NULL,
    job_function_filter text DEFAULT NULL,
    
    -- Boolean filters
    leadership_only boolean DEFAULT FALSE,
    management_exp_only boolean DEFAULT FALSE,
    technical_background_only boolean DEFAULT FALSE,
    sales_exp_only boolean DEFAULT FALSE,
    startup_exp_only boolean DEFAULT FALSE,
    enterprise_exp_only boolean DEFAULT FALSE,
    remote_worker_only boolean DEFAULT FALSE,
    
    -- Enhanced filters
    career_stage_filter text DEFAULT NULL,
    degree_level_filter text DEFAULT NULL,
    school_tier_filter text DEFAULT NULL,
    mentor_potential_only boolean DEFAULT FALSE,
    
    -- Target Company Salary Impact Filters
    chick_fil_a_salary_lift_only boolean DEFAULT FALSE,
    
    -- Range filters
    exit_year_min integer DEFAULT NULL,
    exit_year_max integer DEFAULT NULL,
    limit_count integer DEFAULT 10
) 
RETURNS TABLE (
    id bigint,
    profile_id bigint,
    name text,
    profile_url text,
    home_location text,
    post_company_current_company text,
    post_company_current_title text,
    post_company_current_industry text,
    post_company_current_location text,
    current_company text,
    current_title text,
    current_job_location text,
    chick_fil_a_exit_year integer,
    headline text,
    picture_url text,
    current_job_level text,
    current_job_function text,
    career_stage text,
    highest_degree_level text,
    school_ranking_tier text,
    
    -- Boolean fields
    is_current_leader boolean,
    management_experience boolean,
    technical_background boolean,
    sales_experience boolean,
    has_startup_experience boolean,
    has_enterprise_experience boolean,
    is_remote_worker boolean,
    mentor_potential boolean,
    
    -- Education fields
    undergraduate_school text[],
    graduate_school text[],
    high_school text[],
    pre_company_education text[],
    during_company_education text[],
    post_company_education text[],
    natural_language_education text,
    natural_language_experiences text,
    
    -- Other useful fields
    post_company_companies text[],
    post_company_titles text[],
    post_company_industries text[],
    post_company_locations text[],
    functional_expertise text[],
    industry_expertise text[],
    
    -- Salary fields
    current_estimated_salary numeric,
    highest_career_salary numeric,
    chick_fil_a_provided_salary_lift boolean,
    achieved_six_figure_post_chick_fil_a boolean,
    doubled_salary_post_chick_fil_a boolean,
    moved_to_leadership_post_chick_fil_a boolean,
    
    major_category text,
    similarity double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH vector_candidates AS (
        -- STEP 1: Vector similarity search FIRST (uses the vector index)
        -- This gets a manageable number of candidates based on semantic similarity
        SELECT 
            v.*,
            1 - (v.embedding <=> query_embedding) as similarity_score
        FROM chick_fil_a_alumni_vector v
        WHERE 1 - (v.embedding <=> query_embedding) >= similarity_threshold
        ORDER BY v.embedding <=> query_embedding
        LIMIT (limit_count * 10) -- Get 10x more candidates for metadata filtering
    ),
    filtered_results AS (
        -- STEP 2: Apply metadata filters to the smaller vector candidate set
        -- This operates on much fewer rows, so it's fast
        SELECT vc.*
        FROM vector_candidates vc
        WHERE 
            -- Basic text filters with comprehensive coverage
            (company_filter IS NULL OR 
             vc.post_company_current_company ILIKE '%' || company_filter || '%'
             OR EXISTS (SELECT 1 FROM unnest(vc.post_company_companies) comp_name WHERE comp_name ILIKE '%' || company_filter || '%'))
        AND 
            (industry_filter IS NULL OR 
             vc.post_company_current_industry ILIKE '%' || industry_filter || '%'
             OR EXISTS (SELECT 1 FROM unnest(vc.post_company_industries) ind_name WHERE ind_name ILIKE '%' || industry_filter || '%')
             OR EXISTS (SELECT 1 FROM unnest(vc.industry_expertise) ind_exp WHERE ind_exp ILIKE '%' || industry_filter || '%'))
        AND 
            (title_filter IS NULL OR 
             vc.post_company_current_title ILIKE '%' || title_filter || '%'
             OR EXISTS (SELECT 1 FROM unnest(vc.post_company_titles) job_title WHERE job_title ILIKE '%' || title_filter || '%'))
        AND 
            (location_filter IS NULL OR 
             vc.post_company_current_location ILIKE '%' || location_filter || '%'
             OR vc.home_location ILIKE '%' || location_filter || '%'
             OR EXISTS (SELECT 1 FROM unnest(vc.post_company_locations) loc WHERE loc ILIKE '%' || location_filter || '%'))
        AND
            -- School filter - comprehensive search across all education fields
            (school_filter IS NULL OR 
             EXISTS (SELECT 1 FROM unnest(vc.undergraduate_school) school WHERE school ILIKE '%' || school_filter || '%')
             OR EXISTS (SELECT 1 FROM unnest(vc.graduate_school) school WHERE school ILIKE '%' || school_filter || '%')
             OR EXISTS (SELECT 1 FROM unnest(vc.high_school) school WHERE school ILIKE '%' || school_filter || '%')
             OR EXISTS (SELECT 1 FROM unnest(vc.pre_company_education) school WHERE school ILIKE '%' || school_filter || '%')
             OR EXISTS (SELECT 1 FROM unnest(vc.during_company_education) school WHERE school ILIKE '%' || school_filter || '%')
             OR EXISTS (SELECT 1 FROM unnest(vc.post_company_education) school WHERE school ILIKE '%' || school_filter || '%'))
        AND
            -- Enhanced text filters
            (job_level_filter IS NULL OR 
             vc.current_job_level ILIKE '%' || job_level_filter || '%')
        AND
            (job_function_filter IS NULL OR 
             vc.current_job_function ILIKE '%' || job_function_filter || '%'
             OR EXISTS (SELECT 1 FROM unnest(vc.functional_expertise) func_exp WHERE func_exp ILIKE '%' || job_function_filter || '%'))
        AND
            (career_stage_filter IS NULL OR 
             vc.career_stage ILIKE '%' || career_stage_filter || '%')
        AND
            (degree_level_filter IS NULL OR 
             vc.highest_degree_level ILIKE '%' || degree_level_filter || '%')
        AND
            (school_tier_filter IS NULL OR 
             vc.school_ranking_tier ILIKE '%' || school_tier_filter || '%')
        AND
            -- Boolean filters
            (NOT leadership_only OR vc.is_current_leader = TRUE)
        AND
            (NOT management_exp_only OR vc.management_experience = TRUE)
        AND
            (NOT technical_background_only OR vc.technical_background = TRUE)
        AND
            (NOT sales_exp_only OR vc.sales_experience = TRUE)
        AND
            (NOT startup_exp_only OR vc.has_startup_experience = TRUE)
        AND
            (NOT enterprise_exp_only OR vc.has_enterprise_experience = TRUE)
        AND
            (NOT remote_worker_only OR vc.is_remote_worker = TRUE)
        AND
            (NOT mentor_potential_only OR vc.mentor_potential = TRUE)
        AND
            (NOT chick_fil_a_salary_lift_only OR vc.chick_fil_a_provided_salary_lift = TRUE)
        AND
            -- Range filters
            (exit_year_min IS NULL OR vc.chick_fil_a_exit_year >= exit_year_min)
        AND
            (exit_year_max IS NULL OR vc.chick_fil_a_exit_year <= exit_year_max)
    )
    -- STEP 3: Return final results ordered by similarity
    SELECT 
        fr.id,
        fr.profile_id,
        fr.name,
        fr.profile_url,
        fr.home_location,
        fr.post_company_current_company,
        fr.post_company_current_title,
        fr.post_company_current_industry,
        fr.post_company_current_location,
        fr.current_company,
        fr.current_title,
        fr.current_job_location,
        fr.chick_fil_a_exit_year,
        fr.headline,
        fr.picture_url,
        fr.current_job_level,
        fr.current_job_function,
        fr.career_stage,
        fr.highest_degree_level,
        fr.school_ranking_tier,
        fr.is_current_leader,
        fr.management_experience,
        fr.technical_background,
        fr.sales_experience,
        fr.has_startup_experience,
        fr.has_enterprise_experience,
        fr.is_remote_worker,
        fr.mentor_potential,
        fr.undergraduate_school,
        fr.graduate_school,
        fr.high_school,
        fr.pre_company_education,
        fr.during_company_education,
        fr.post_company_education,
        fr.natural_language_education,
        fr.natural_language_experiences,
        fr.post_company_companies,
        fr.post_company_titles,
        fr.post_company_industries,
        fr.post_company_locations,
        fr.functional_expertise,
        fr.industry_expertise,
        fr.current_estimated_salary,
        fr.highest_career_salary,
        fr.chick_fil_a_provided_salary_lift,
        fr.achieved_six_figure_post_chick_fil_a,
        fr.doubled_salary_post_chick_fil_a,
        fr.moved_to_leadership_post_chick_fil_a,
        fr.major_category,
        fr.similarity_score
    FROM filtered_results fr
    ORDER BY fr.similarity_score DESC
    LIMIT limit_count;
END;
$$;

-- Add function documentation
COMMENT ON FUNCTION enhanced_hybrid_search_chick_fil_a IS 'Vector-first search function: Uses vector index for initial candidates, then applies metadata filters. Prevents timeouts while maintaining accuracy.';

-- Test the function exists and has correct signature
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'enhanced_hybrid_search_chick_fil_a';

-- Quick test with a dummy embedding (replace with real test)
/*
SELECT COUNT(*) as result_count
FROM enhanced_hybrid_search_chick_fil_a(
    query_embedding := '[0,0,0,0,0,0,0,0,0,0]'::vector(1536),
    similarity_threshold := 0.1,
    limit_count := 5
);
*/ 