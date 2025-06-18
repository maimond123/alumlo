-- DEBUG SCRIPT: Investigating Dartmouth College search issue
-- Run this to understand why no results are being returned

-- 1. First, let's see what schools exist in the database
SELECT DISTINCT unnest(undergraduate_school) as school_name
FROM chick_fil_a_alumni_standard_search 
WHERE undergraduate_school IS NOT NULL 
AND array_length(undergraduate_school, 1) > 0
ORDER BY school_name;

-- 2. Check for any Dartmouth variations
SELECT DISTINCT unnest(undergraduate_school) as school_name
FROM chick_fil_a_alumni_standard_search 
WHERE undergraduate_school IS NOT NULL 
AND unnest(undergraduate_school) ILIKE '%dartmouth%'
ORDER BY school_name;

-- 3. Check graduate schools too
SELECT DISTINCT unnest(graduate_school) as school_name
FROM chick_fil_a_alumni_standard_search 
WHERE graduate_school IS NOT NULL 
AND unnest(graduate_school) ILIKE '%dartmouth%'
ORDER BY school_name;

-- 4. Test the exact fuzzy matching logic we implemented
SELECT 
  id, 
  name, 
  undergraduate_school, 
  graduate_school
FROM chick_fil_a_alumni_standard_search 
WHERE (
  EXISTS(SELECT 1 FROM unnest(undergraduate_school) AS us WHERE us ILIKE '%Dartmouth College%') OR
  EXISTS(SELECT 1 FROM unnest(graduate_school) AS gs WHERE gs ILIKE '%Dartmouth College%')
)
LIMIT 10;

-- 5. Test with just "Dartmouth" (more fuzzy)
SELECT 
  id, 
  name, 
  undergraduate_school, 
  graduate_school
FROM chick_fil_a_alumni_standard_search 
WHERE (
  EXISTS(SELECT 1 FROM unnest(undergraduate_school) AS us WHERE us ILIKE '%Dartmouth%') OR
  EXISTS(SELECT 1 FROM unnest(graduate_school) AS gs WHERE gs ILIKE '%Dartmouth%')
)
LIMIT 10;

-- 6. Test the exact SQL function call with Dartmouth College filter
SELECT COUNT(*) as result_count
FROM chick_fil_a_alumni_standard_search v
WHERE (
  -- Apply the exact same school filter logic from our function
  ('Dartmouth College' IS NOT NULL AND 
   (EXISTS(SELECT 1 FROM unnest(v.undergraduate_school) AS us WHERE us ILIKE '%Dartmouth College%') OR
    EXISTS(SELECT 1 FROM unnest(v.graduate_school) AS gs WHERE gs ILIKE '%Dartmouth College%')))
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