-- DEBUG: Test each WHERE clause section individually
-- Find which condition is filtering out all 6011 records

-- 1. Test with no WHERE clause (should return all 6011)
SELECT COUNT(*) as count_no_filters
FROM chick_fil_a_alumni_standard_search v;

-- 2. Test just the basic entity filters
SELECT COUNT(*) as count_basic_filters
FROM chick_fil_a_alumni_standard_search v
WHERE 1=1
    AND (('{}'::jsonb)->>'company_filter') IS NULL
    AND (('{}'::jsonb)->>'industry_filter') IS NULL
    AND (('{}'::jsonb)->>'title_filter') IS NULL
    AND (('{}'::jsonb)->>'location_filter') IS NULL
    AND (('{}'::jsonb)->>'school_filter') IS NULL;

-- 3. Test boolean filters that might be problematic
SELECT COUNT(*) as count_boolean_filters
FROM chick_fil_a_alumni_standard_search v
WHERE 1=1
    AND (('{}'::jsonb)->>'is_current_leader')::boolean = FALSE OR v.is_current_leader = TRUE
    AND (('{}'::jsonb)->>'management_experience')::boolean = FALSE OR v.management_experience = TRUE
    AND (('{}'::jsonb)->>'revenue_responsibility')::boolean = FALSE OR v.revenue_responsibility = TRUE;

-- 4. Test one problematic boolean filter at a time
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN v.is_current_leader IS NOT NULL THEN 1 END) as non_null_leader,
  COUNT(CASE WHEN v.is_current_leader = TRUE THEN 1 END) as true_leader,
  COUNT(CASE WHEN v.is_current_leader = FALSE THEN 1 END) as false_leader
FROM chick_fil_a_alumni_standard_search v;

-- 5. Test the exact boolean logic
SELECT COUNT(*) as count_leader_filter
FROM chick_fil_a_alumni_standard_search v
WHERE (('{}'::jsonb)->>'is_current_leader')::boolean = FALSE OR v.is_current_leader = TRUE; 