-- DEBUG: Check if the underlying table has data
-- This will tell us if the issue is no data vs function logic

-- 1. Check if the table exists and has data
SELECT COUNT(*) as total_rows 
FROM chick_fil_a_alumni_standard_search;

-- 2. If there's data, show a few sample rows
SELECT 
  id, 
  name, 
  post_company_current_company,
  post_company_current_title,
  undergraduate_school[1:2] as sample_schools
FROM chick_fil_a_alumni_standard_search 
LIMIT 3;

-- 3. Check what tables actually exist with "chick_fil_a" in the name
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%chick_fil_a%'
ORDER BY table_name; 