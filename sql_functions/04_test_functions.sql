-- =====================================================
-- TESTING SCRIPT FOR VECTOR FUNCTIONS
-- =====================================================
-- This script helps you test both functions and compare results

-- =====================================================
-- STEP 1: VERIFY FUNCTIONS EXIST
-- =====================================================
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname IN ('test_vector_only_chick_fil_a', 'test_vector_first_chick_fil_a')
ORDER BY proname;

-- =====================================================
-- STEP 2: CHECK INDEX STATUS
-- =====================================================
-- Verify that the vector index was created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'chick_fil_a_alumni_vector'
  AND indexname LIKE '%embedding%'
ORDER BY indexname;

-- Check table size and basic stats
SELECT 
    schemaname,
    tablename,
    n_tup_ins as total_rows,
    n_tup_upd as updated_rows,
    n_tup_del as deleted_rows,
    n_live_tup as live_rows,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE relname = 'chick_fil_a_alumni_vector';

-- =====================================================
-- STEP 3: GET A SAMPLE EMBEDDING FOR TESTING
-- =====================================================
-- Get a real embedding from your table to use in tests
SELECT 
    id,
    name,
    post_company_current_company,
    current_job_level,
    embedding
FROM chick_fil_a_alumni_vector 
WHERE embedding IS NOT NULL
LIMIT 1;

-- =====================================================
-- STEP 4: TEST FUNCTIONS WITH SAMPLE DATA
-- =====================================================
-- REPLACE THE EMBEDDING BELOW WITH A REAL ONE FROM STEP 3
-- Example test embedding (replace with real data):

DO $$
DECLARE
    sample_embedding vector(1536);
    vector_only_count int;
    vector_first_count int;
    vector_first_filtered_count int;
BEGIN
    -- Get a sample embedding from the table
    SELECT embedding INTO sample_embedding 
    FROM chick_fil_a_alumni_vector 
    WHERE embedding IS NOT NULL 
    LIMIT 1;
    
    IF sample_embedding IS NULL THEN
        RAISE NOTICE 'ERROR: No embeddings found in table!';
        RETURN;
    END IF;
    
    -- Test 1: Vector-only function
    RAISE NOTICE '=== TESTING VECTOR-ONLY FUNCTION ===';
    SELECT COUNT(*) INTO vector_only_count
    FROM test_vector_only_chick_fil_a(
        query_embedding := sample_embedding,
        similarity_threshold := 0.3,
        limit_count := 50
    );
    RAISE NOTICE 'Vector-only results: %', vector_only_count;
    
    -- Test 2: Vector-first function (no filters)
    RAISE NOTICE '=== TESTING VECTOR-FIRST FUNCTION (NO FILTERS) ===';
    SELECT COUNT(*) INTO vector_first_count
    FROM test_vector_first_chick_fil_a(
        query_embedding := sample_embedding,
        similarity_threshold := 0.3,
        limit_count := 50
    );
    RAISE NOTICE 'Vector-first (no filters) results: %', vector_first_count;
    
    -- Test 3: Vector-first function (with filters)
    RAISE NOTICE '=== TESTING VECTOR-FIRST FUNCTION (WITH FILTERS) ===';
    SELECT COUNT(*) INTO vector_first_filtered_count
    FROM test_vector_first_chick_fil_a(
        query_embedding := sample_embedding,
        similarity_threshold := 0.3,
        leadership_only := true,  -- Apply a filter
        limit_count := 50
    );
    RAISE NOTICE 'Vector-first (with leadership filter) results: %', vector_first_filtered_count;
    
    -- Summary
    RAISE NOTICE '=== SUMMARY ===';
    RAISE NOTICE 'Vector-only: % results', vector_only_count;
    RAISE NOTICE 'Vector-first (no filters): % results', vector_first_count;
    RAISE NOTICE 'Vector-first (leadership filter): % results', vector_first_filtered_count;
    
    IF vector_only_count = 0 THEN
        RAISE NOTICE 'WARNING: Vector search returning 0 results - check embedding data or similarity threshold';
    END IF;
    
    IF vector_first_filtered_count = 0 AND vector_first_count > 0 THEN
        RAISE NOTICE 'WARNING: Metadata filtering is eliminating all results - metadata fields may be NULL or filter too restrictive';
    END IF;
    
END $$;

-- =====================================================
-- STEP 5: DETAILED METADATA ANALYSIS
-- =====================================================
-- Check what metadata is actually available in your table

RAISE NOTICE '=== METADATA FIELD ANALYSIS ===';

-- Check leadership field distribution
SELECT 
    'is_current_leader' as field_name,
    is_current_leader as value,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM chick_fil_a_alumni_vector 
GROUP BY is_current_leader
ORDER BY value;

-- Check job level distribution
SELECT 
    'current_job_level' as field_name,
    COALESCE(current_job_level, 'NULL') as value,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM chick_fil_a_alumni_vector 
GROUP BY current_job_level
ORDER BY count DESC
LIMIT 10;

-- Check industry distribution
SELECT 
    'post_company_current_industry' as field_name,
    COALESCE(post_company_current_industry, 'NULL') as value,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM chick_fil_a_alumni_vector 
GROUP BY post_company_current_industry
ORDER BY count DESC
LIMIT 10;

-- Check how many rows have NULL values for key fields
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN is_current_leader IS NULL THEN 1 END) as null_leadership,
    COUNT(CASE WHEN current_job_level IS NULL OR current_job_level = '' THEN 1 END) as null_job_level,
    COUNT(CASE WHEN post_company_current_industry IS NULL OR post_company_current_industry = '' THEN 1 END) as null_industry,
    COUNT(CASE WHEN post_company_current_company IS NULL OR post_company_current_company = '' THEN 1 END) as null_company,
    COUNT(CASE WHEN embedding IS NULL THEN 1 END) as null_embedding
FROM chick_fil_a_alumni_vector;

-- =====================================================
-- STEP 6: PERFORMANCE TESTING
-- =====================================================
-- Test execution time for both functions

DO $$
DECLARE
    sample_embedding vector(1536);
    start_time timestamp;
    end_time timestamp;
    duration interval;
BEGIN
    -- Get a sample embedding
    SELECT embedding INTO sample_embedding 
    FROM chick_fil_a_alumni_vector 
    WHERE embedding IS NOT NULL 
    LIMIT 1;
    
    IF sample_embedding IS NULL THEN
        RAISE NOTICE 'ERROR: No embeddings found for performance testing!';
        RETURN;
    END IF;
    
    -- Test vector-only performance
    RAISE NOTICE '=== PERFORMANCE TESTING ===';
    start_time := clock_timestamp();
    
    PERFORM * FROM test_vector_only_chick_fil_a(
        query_embedding := sample_embedding,
        similarity_threshold := 0.3,
        limit_count := 10
    );
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    RAISE NOTICE 'Vector-only function execution time: %', duration;
    
    -- Test vector-first performance (no filters)
    start_time := clock_timestamp();
    
    PERFORM * FROM test_vector_first_chick_fil_a(
        query_embedding := sample_embedding,
        similarity_threshold := 0.3,
        limit_count := 10
    );
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    RAISE NOTICE 'Vector-first function (no filters) execution time: %', duration;
    
    -- Test vector-first performance (with filters)
    start_time := clock_timestamp();
    
    PERFORM * FROM test_vector_first_chick_fil_a(
        query_embedding := sample_embedding,
        similarity_threshold := 0.3,
        leadership_only := true,
        limit_count := 10
    );
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    RAISE NOTICE 'Vector-first function (with filters) execution time: %', duration;
    
END $$;

-- =====================================================
-- STEP 7: SAMPLE OUTPUT COMPARISON
-- =====================================================
-- Compare actual results from both functions

-- Get sample embedding for testing
WITH sample_data AS (
    SELECT embedding as test_embedding
    FROM chick_fil_a_alumni_vector 
    WHERE embedding IS NOT NULL
    LIMIT 1
),
vector_only_results AS (
    SELECT 
        'vector_only' as source,
        id,
        name,
        post_company_current_company,
        current_job_level,
        is_current_leader,
        similarity
    FROM test_vector_only_chick_fil_a(
        query_embedding := (SELECT test_embedding FROM sample_data),
        similarity_threshold := 0.3,
        limit_count := 5
    )
),
vector_first_results AS (
    SELECT 
        'vector_first' as source,
        id,
        name,
        post_company_current_company,
        current_job_level,
        is_current_leader,
        similarity
    FROM test_vector_first_chick_fil_a(
        query_embedding := (SELECT test_embedding FROM sample_data),
        similarity_threshold := 0.3,
        limit_count := 5
    )
)
SELECT * FROM vector_only_results
UNION ALL
SELECT * FROM vector_first_results
ORDER BY source, similarity DESC;

-- =====================================================
-- TROUBLESHOOTING QUERIES
-- =====================================================

-- Check if the pgvector extension is installed
SELECT 
    extname,
    extversion 
FROM pg_extension 
WHERE extname = 'vector';

-- Check PostgreSQL version
SELECT version();

-- Check available operators for vector type
SELECT 
    oprname,
    oprcode,
    oprleft::regtype,
    oprright::regtype,
    oprresult::regtype
FROM pg_operator 
WHERE oprname IN ('<->', '<=>', '<#>', '<+>')
ORDER BY oprname; 