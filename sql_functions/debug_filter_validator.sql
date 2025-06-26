-- DEBUG FUNCTION: Test JSON filter parsing
CREATE OR REPLACE FUNCTION debug_json_filters(
    test_filters jsonb DEFAULT '{}'
)
RETURNS TABLE (
    filter_key text,
    filter_value text,
    filter_type text,
    parsed_correctly boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'total_experience_years' as filter_key,
    COALESCE(test_filters->>'total_experience_years', 'NULL') as filter_value,
    pg_typeof((test_filters->>'total_experience_years')::numeric)::text as filter_type,
    (test_filters->>'total_experience_years') IS NOT NULL as parsed_correctly
  UNION ALL
  SELECT 
    'geographic_mobility' as filter_key,
    COALESCE(test_filters->>'geographic_mobility', 'NULL') as filter_value,
    pg_typeof((test_filters->>'geographic_mobility')::boolean)::text as filter_type,
    (test_filters->>'geographic_mobility') IS NOT NULL as parsed_correctly
  UNION ALL
  SELECT 
    'school_filter' as filter_key,
    COALESCE(test_filters->>'school_filter', 'NULL') as filter_value,
    'text' as filter_type,
    (test_filters->>'school_filter') IS NOT NULL as parsed_correctly
  UNION ALL
  SELECT 
    'company_filter' as filter_key,
    COALESCE(test_filters->>'company_filter', 'NULL') as filter_value,
    'text' as filter_type,
    (test_filters->>'company_filter') IS NOT NULL as parsed_correctly;
END;
$$ LANGUAGE plpgsql;

-- Test the filter parsing
-- SELECT * FROM debug_json_filters('{"total_experience_years": 15, "geographic_mobility": true}'); 