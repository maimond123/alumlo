-- DEBUG SCRIPT: Test the exact function call for Dartmouth College search
-- This simulates what happens when the API calls the SQL function

-- Test the exact function call with the school filter
SELECT * FROM comprehensive_standard_search_chick_fil_a(
  '{"school_filter": "Dartmouth College"}'::jsonb,
  NULL,
  50
);

-- Test with a simpler filter to see if function works at all
SELECT * FROM comprehensive_standard_search_chick_fil_a(
  '{}'::jsonb,
  NULL,
  5
);

-- Test with just "Dartmouth" instead of "Dartmouth College" 
SELECT * FROM comprehensive_standard_search_chick_fil_a(
  '{"school_filter": "Dartmouth"}'::jsonb,
  NULL,
  50
);

-- Test other filters to ensure function is working
SELECT * FROM comprehensive_standard_search_chick_fil_a(
  '{"company_filter": "Google"}'::jsonb,
  NULL,
  10
); 