-- =====================================================
-- VECTOR-ONLY SEARCH (NO METADATA FILTERING)
-- =====================================================
-- This function performs ONLY vector similarity search with no metadata filters
-- This is for testing to see if the issue is with metadata filtering

CREATE OR REPLACE FUNCTION test_vector_only_chick_fil_a(
    query_embedding vector(1536),
    similarity_threshold float DEFAULT 0.3,
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
    -- Pure vector similarity search - no metadata filtering at all
    SELECT 
        v.id,
        v.profile_id,
        v.name,
        v.profile_url,
        v.home_location,
        v.post_company_current_company,
        v.post_company_current_title,
        v.post_company_current_industry,
        v.post_company_current_location,
        v.current_company,
        v.current_title,
        v.current_job_location,
        v.chick_fil_a_exit_year,
        v.headline,
        v.picture_url,
        v.current_job_level,
        v.current_job_function,
        v.career_stage,
        v.highest_degree_level,
        v.school_ranking_tier,
        v.is_current_leader,
        v.management_experience,
        v.technical_background,
        v.sales_experience,
        v.has_startup_experience,
        v.has_enterprise_experience,
        v.is_remote_worker,
        v.mentor_potential,
        v.undergraduate_school,
        v.graduate_school,
        v.high_school,
        v.pre_company_education,
        v.during_company_education,
        v.post_company_education,
        v.natural_language_education,
        v.natural_language_experiences,
        v.post_company_companies,
        v.post_company_titles,
        v.post_company_industries,
        v.post_company_locations,
        v.functional_expertise,
        v.industry_expertise,
        v.current_estimated_salary,
        v.highest_career_salary,
        v.chick_fil_a_provided_salary_lift,
        v.achieved_six_figure_post_chick_fil_a,
        v.doubled_salary_post_chick_fil_a,
        v.moved_to_leadership_post_chick_fil_a,
        v.major_category,
        1 - (v.embedding <=> query_embedding) as similarity_score
    FROM chick_fil_a_alumni_vector v
    WHERE 1 - (v.embedding <=> query_embedding) >= similarity_threshold
    ORDER BY v.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$;

-- Add helpful comments for debugging
COMMENT ON FUNCTION test_vector_only_chick_fil_a IS 'Pure vector similarity search with no metadata filtering. For testing vector search performance and accuracy.';

-- Grant execution permissions
-- GRANT EXECUTE ON FUNCTION test_vector_only_chick_fil_a TO authenticated;

-- Example usage:
/*
SELECT * FROM test_vector_only_chick_fil_a(
    query_embedding := '[0.1,0.2,0.3,...]'::vector(1536),
    similarity_threshold := 0.3,
    limit_count := 10
);
*/

-- Quick verification query to test that the function exists and works:
/*
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname IN ('test_vector_only_chick_fil_a', 'test_vector_first_chick_fil_a')
ORDER BY proname;
*/ 