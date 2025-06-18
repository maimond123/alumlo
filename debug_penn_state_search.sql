-- DEBUG SCRIPT: Investigating Penn State University search issue
-- Run this to understand why no results are being returned

-- 1. First, let's see what schools exist in the database that contain "Penn"
SELECT DISTINCT unnest(undergraduate_school) as school_name
FROM chick_fil_a_alumni_standard_search 
WHERE undergraduate_school IS NOT NULL 
AND unnest(undergraduate_school) ILIKE '%Penn%'
ORDER BY school_name;

-- 2. Check graduate schools too for Penn
SELECT DISTINCT unnest(graduate_school) as school_name
FROM chick_fil_a_alumni_standard_search 
WHERE graduate_school IS NOT NULL 
AND unnest(graduate_school) ILIKE '%Penn%'
ORDER BY school_name;

-- 3. Check for "State" schools
SELECT DISTINCT unnest(undergraduate_school) as school_name
FROM chick_fil_a_alumni_standard_search 
WHERE undergraduate_school IS NOT NULL 
AND unnest(undergraduate_school) ILIKE '%State%'
ORDER BY school_name
LIMIT 20;

-- 4. Test the exact fuzzy matching logic with Penn State University
SELECT 
  id, 
  name, 
  undergraduate_school, 
  graduate_school
FROM chick_fil_a_alumni_standard_search 
WHERE (
  EXISTS(SELECT 1 FROM unnest(undergraduate_school) AS us WHERE us ILIKE '%Penn State University%') OR
  EXISTS(SELECT 1 FROM unnest(graduate_school) AS gs WHERE gs ILIKE '%Penn State University%')
)
LIMIT 10;

-- 5. Test with shorter "Penn State" (more fuzzy)
SELECT 
  id, 
  name, 
  undergraduate_school, 
  graduate_school
FROM chick_fil_a_alumni_standard_search 
WHERE (
  EXISTS(SELECT 1 FROM unnest(undergraduate_school) AS us WHERE us ILIKE '%Penn State%') OR
  EXISTS(SELECT 1 FROM unnest(graduate_school) AS gs WHERE gs ILIKE '%Penn State%')
)
LIMIT 10;

-- 6. Test the exact SQL function call with Penn State University filter
SELECT COUNT(*) as result_count
FROM chick_fil_a_alumni_standard_search v
WHERE (
  -- Apply the exact same school filter logic from our function
  ('Penn State University' IS NOT NULL AND 
   (EXISTS(SELECT 1 FROM unnest(v.undergraduate_school) AS us WHERE us ILIKE '%Penn State University%') OR
    EXISTS(SELECT 1 FROM unnest(v.graduate_school) AS gs WHERE gs ILIKE '%Penn State University%')))
);

-- 7. Check if the table has any data at all
SELECT COUNT(*) as total_rows FROM chick_fil_a_alumni_standard_search;

-- 8. Check a few sample records to see the data structure
SELECT 
  id, 
  name, 
  undergraduate_school[1:3] as first_3_undergrad_schools,
  graduate_school[1:3] as first_3_grad_schools
FROM chick_fil_a_alumni_standard_search 
LIMIT 5;

-- 9. Look for Pennsylvania variations
SELECT DISTINCT unnest(undergraduate_school) as school_name
FROM chick_fil_a_alumni_standard_search 
WHERE undergraduate_school IS NOT NULL 
AND unnest(undergraduate_school) ILIKE '%Pennsylvania%'
ORDER BY school_name; 