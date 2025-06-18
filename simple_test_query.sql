-- SIMPLE TEST QUERY: Basic functionality test
-- This should return results if the function is working at all

-- 1. Most basic test - no filters, should return any 5 results
SELECT 
  id, 
  name, 
  post_company_current_company,
  post_company_current_title,
  undergraduate_school
FROM comprehensive_standard_search_chick_fil_a(
  '{}'::jsonb,
  NULL,
  5
);

-- 2. Test with a common company name (if any exist)
SELECT 
  id, 
  name, 
  post_company_current_company,
  undergraduate_school
FROM comprehensive_standard_search_chick_fil_a(
  '{"company_filter": "Google"}'::jsonb,
  NULL,
  10
);

-- 3. Test with a very generic search query
SELECT 
  id, 
  name, 
  post_company_current_company,
  undergraduate_school
FROM comprehensive_standard_search_chick_fil_a(
  '{}'::jsonb,
  'manager',
  10
); 