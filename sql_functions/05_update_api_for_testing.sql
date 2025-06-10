-- =====================================================
-- API UPDATE INSTRUCTIONS FOR TESTING
-- =====================================================
-- This file contains instructions for updating your API to use the test functions

/*
TO TEST THE FUNCTIONS WITH YOUR API:

1. Temporarily modify your ai_search.ts file to call the test functions instead of enhanced_hybrid_search_chick_fil_a

2. In the searchCompany method (around line 500), change this:
   const rpcFunctionName = `enhanced_hybrid_search_${storedOrganizationName}`;

   To this for vector-only testing:
   const rpcFunctionName = `test_vector_only_${storedOrganizationName}`;

   Or this for vector-first testing:
   const rpcFunctionName = `test_vector_first_${storedOrganizationName}`;

3. For the vector-only test, simplify the RPC parameters to only include:
   const rpcParams = {
     query_embedding: embeddingArray,
     similarity_threshold: 0.3,
     limit_count: 50
   };

4. For the vector-first test, keep all your existing parameters as they are.

EXAMPLE MODIFIED SEARCHCOMPANY METHOD:
*/

-- Example TypeScript code for your ai_search.ts modification:
/*
// VECTOR-ONLY TEST VERSION
const rpcFunctionName = `test_vector_only_${storedOrganizationName}`;
const rpcParams = {
  query_embedding: embeddingArray,
  similarity_threshold: 0.3,
  limit_count: 50
};

// OR VECTOR-FIRST TEST VERSION  
const rpcFunctionName = `test_vector_first_${storedOrganizationName}`;
const rpcParams = {
  query_embedding: embeddingArray,
  similarity_threshold: 0.3,
  company_filter: company || null,
  industry_filter: industry || null,
  title_filter: title || null,
  location_filter: location || null,
  school_filter: school || null,
  job_level_filter: job_level_filter || null,
  job_function_filter: job_function_filter || null,
  career_stage_filter: career_stage_filter || null,
  degree_level_filter: degree_level_filter || null,
  school_tier_filter: school_tier_filter || null,
  leadership_only,
  management_exp_only,
  technical_background_only,
  sales_exp_only,
  startup_exp_only,
  enterprise_exp_only,
  remote_worker_only,
  mentor_potential_only,
  exit_year_min: exit_year_min || null,
  exit_year_max: exit_year_max || null,
  limit_count: 50
};
rpcParams[dynamicSalaryLiftParam] = salary_lift_only;
*/

-- =====================================================
-- TESTING WORKFLOW RECOMMENDATIONS
-- =====================================================

/*
RECOMMENDED TESTING WORKFLOW:

1. First, run sql_functions/01_create_indexes_chick_fil_a.sql to create all necessary indexes
   - This is CRITICAL for performance and preventing timeouts

2. Run sql_functions/02_vector_first_with_metadata.sql to create the vector-first function

3. Run sql_functions/03_vector_only.sql to create the vector-only function

4. Run sql_functions/04_test_functions.sql to verify everything works in SQL

5. Test the vector-only function first with your API:
   - Modify ai_search.ts to use test_vector_only_chick_fil_a
   - Search for "graduates of Notre Dame University"
   - Should return results if vector search is working

6. Test the vector-first function with no filters:
   - Modify ai_search.ts to use test_vector_first_chick_fil_a
   - Use same search query
   - Should return same results as vector-only

7. Test the vector-first function with filters:
   - Keep using test_vector_first_chick_fil_a
   - Add some filters in your search
   - Check if results are filtered appropriately

8. Compare results and performance between all three approaches

EXPECTED OUTCOMES:
- Vector-only: Should return results based purely on semantic similarity
- Vector-first (no filters): Should return same results as vector-only
- Vector-first (with filters): Should return subset of vector-only results

If vector-only returns 0 results:
- Check embedding data exists
- Lower similarity threshold
- Check pgvector extension and indexes

If vector-first with filters returns 0 results but vector-only returns results:
- Metadata filtering is too restrictive
- Check for NULL values in metadata fields
- Check filter logic in the function

DEBUGGING QUERIES TO RUN:
*/

-- Check if you have any actual data
SELECT COUNT(*) as total_rows FROM chick_fil_a_alumni_vector;

-- Check if embeddings exist
SELECT COUNT(*) as rows_with_embeddings 
FROM chick_fil_a_alumni_vector 
WHERE embedding IS NOT NULL;

-- Check school name variations in your data
SELECT DISTINCT unnest(undergraduate_school) as school_name
FROM chick_fil_a_alumni_vector 
WHERE undergraduate_school IS NOT NULL
  AND 'Notre Dame' = ANY(
    SELECT unnest(
      string_to_array(lower(unnest(undergraduate_school)), ' ')
    )
  )
LIMIT 20;

-- Check for leadership data
SELECT 
  is_current_leader,
  COUNT(*) as count
FROM chick_fil_a_alumni_vector 
GROUP BY is_current_leader;

-- =====================================================
-- ROLLBACK PLAN
-- =====================================================

/*
TO ROLLBACK TO YOUR ORIGINAL FUNCTION:

1. Change the rpcFunctionName back to:
   const rpcFunctionName = `enhanced_hybrid_search_${storedOrganizationName}`;

2. Restore your original rpcParams object with all parameters

3. The test functions will remain in your database for future testing but won't interfere with normal operations

CLEANUP (if needed):
DROP FUNCTION IF EXISTS test_vector_only_chick_fil_a;
DROP FUNCTION IF EXISTS test_vector_first_chick_fil_a;
*/ 