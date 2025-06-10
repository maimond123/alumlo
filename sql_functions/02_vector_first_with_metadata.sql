-- =====================================================
-- VECTOR-FIRST SEARCH WITH METADATA FILTERING
-- =====================================================
-- This function performs vector similarity search FIRST, then applies metadata filters
-- Requires the indexes from 01_create_indexes_chick_fil_a.sql to be created first

CREATE OR REPLACE FUNCTION test_vector_first_chick_fil_a(
    query_embedding vector(1536),
    similarity_threshold float DEFAULT 0.3,
    company_filter text DEFAULT NULL,
    industry_filter text DEFAULT NULL,
    title_filter text DEFAULT NULL,
    location_filter text DEFAULT NULL,
    school_filter text DEFAULT NULL,
    job_level_filter text DEFAULT NULL,
    job_function_filter text DEFAULT NULL,
    leadership_only boolean DEFAULT FALSE,
    management_exp_only boolean DEFAULT FALSE,
    technical_background_only boolean DEFAULT FALSE,
    sales_exp_only boolean DEFAULT FALSE,
    startup_exp_only boolean DEFAULT FALSE,
    enterprise_exp_only boolean DEFAULT FALSE,
    remote_worker_only boolean DEFAULT FALSE,
    career_stage_filter text DEFAULT NULL,
    degree_level_filter text DEFAULT NULL,
    school_tier_filter text DEFAULT NULL,
    mentor_potential_only boolean DEFAULT FALSE,
    chick_fil_a_salary_lift_only boolean DEFAULT FALSE,
    exit_year_min int DEFAULT NULL,
    exit_year_max int DEFAULT NULL,
    limit_count int DEFAULT 10
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
    chick_fil_a_exit_year int,
    headline text,
    picture_url text,
    current_job_level text,
    current_job_function text,
    career_stage text,
    highest_degree_level text,
    school_ranking_tier text,
    is_current_leader boolean,
    management_experience boolean,
    technical_background boolean,
    sales_experience boolean,
    has_startup_experience boolean,
    has_enterprise_experience boolean,
    is_remote_worker boolean,
    mentor_potential boolean,
    undergraduate_school text[],
    graduate_school text[],
    high_school text[],
    pre_company_education text[],
    during_company_education text[],
    post_company_education text[],
    natural_language_education text,
    natural_language_experiences text,
    post_company_companies text[],
    post_company_titles text[],
    post_company_industries text[],
    post_company_locations text[],
    functional_expertise text[],
    industry_expertise text[],
    current_estimated_salary int,
    highest_career_salary int,
    chick_fil_a_provided_salary_lift boolean,
    achieved_six_figure_post_chick_fil_a boolean,
    doubled_salary_post_chick_fil_a boolean,
    moved_to_leadership_post_chick_fil_a boolean,
    major_category text,
    similarity float
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH vector_candidates AS (
        -- STEP 1: Vector similarity search (using the vector index)
        -- This should be fast due to the ivfflat index
        SELECT 
            v.*,
            1 - (v.embedding <=> query_embedding) as similarity_score
        FROM chick_fil_a_alumni_vector v
        WHERE 1 - (v.embedding <=> query_embedding) >= similarity_threshold
        ORDER BY v.embedding <=> query_embedding
        LIMIT (limit_count * 5) -- Get 5x more candidates for filtering
    ),
    filtered_results AS (
        -- STEP 2: Apply metadata filters to vector candidates
        -- This operates on a much smaller dataset (filtered by vector similarity first)
        SELECT 
            vc.*
        FROM vector_candidates vc
        WHERE 
            -- Basic text filters (with fuzzy matching)
            (company_filter IS NULL OR 
             vc.post_company_current_company ILIKE '%' || company_filter || '%')
        AND 
            (industry_filter IS NULL OR 
             vc.post_company_current_industry ILIKE '%' || industry_filter || '%')
        AND 
            (title_filter IS NULL OR 
             vc.post_company_current_title ILIKE '%' || title_filter || '%')
        AND 
            (location_filter IS NULL OR 
             vc.post_company_current_location ILIKE '%' || location_filter || '%')
        AND
            -- School filter (check multiple education arrays)
            (school_filter IS NULL OR 
             EXISTS (
                 SELECT 1 FROM unnest(vc.undergraduate_school) AS school 
                 WHERE school ILIKE '%' || school_filter || '%'
             ) OR
             EXISTS (
                 SELECT 1 FROM unnest(vc.graduate_school) AS school 
                 WHERE school ILIKE '%' || school_filter || '%'
             ) OR
             EXISTS (
                 SELECT 1 FROM unnest(vc.high_school) AS school 
                 WHERE school ILIKE '%' || school_filter || '%'
             ))
        AND
            -- Enhanced text filters
            (job_level_filter IS NULL OR 
             vc.current_job_level ILIKE '%' || job_level_filter || '%')
        AND
            (job_function_filter IS NULL OR 
             vc.current_job_function ILIKE '%' || job_function_filter || '%')
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
            (NOT leadership_only OR vc.is_current_leader = true)
        AND
            (NOT management_exp_only OR vc.management_experience = true)
        AND
            (NOT technical_background_only OR vc.technical_background = true)
        AND
            (NOT sales_exp_only OR vc.sales_experience = true)
        AND
            (NOT startup_exp_only OR vc.has_startup_experience = true)
        AND
            (NOT enterprise_exp_only OR vc.has_enterprise_experience = true)
        AND
            (NOT remote_worker_only OR vc.is_remote_worker = true)
        AND
            (NOT mentor_potential_only OR vc.mentor_potential = true)
        AND
            (NOT chick_fil_a_salary_lift_only OR vc.chick_fil_a_provided_salary_lift = true)
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

-- Add helpful comments for debugging
COMMENT ON FUNCTION test_vector_first_chick_fil_a IS 'Vector-first search with metadata filtering. Uses vector index for initial candidates, then applies metadata filters.';

-- Grant execution permissions
-- GRANT EXECUTE ON FUNCTION test_vector_first_chick_fil_a TO authenticated;

-- Example usage:
/*
SELECT * FROM test_vector_first_chick_fil_a(
    query_embedding := '[0.1,0.2,0.3,...]'::vector(1536),
    similarity_threshold := 0.3,
    industry_filter := 'technology',
    leadership_only := true,
    limit_count := 10
);
*/ 