# Event Sourcing Input JSON Structures

## Career Events JSON Input Structure

### Career Event Object (Fast Retrieval - Main Table)
```json
{
  "profile_id": 12345,
  "career_events": [
    {
      "event_id": "ce_001",
      "event_type": "job_start",
      "event_timestamp": "2018-01-15T00:00:00Z",
      "sequence_number": 1,
      
      // Core job details (commonly searched)
      "company": "Chick-fil-A",
      "title": "Team Member",
      
      // Precise timing (essential for temporal analysis)
      "start_year": 2018,
      "start_month": 1,
      "end_year": 2019,
      "end_month": 6,
      "is_current_position": false,
      
      // Career progression fields (commonly searched)
      "industry": "Food Service",
      "job_level": "Entry Level",
      "job_function": "Customer Service",
      "location": "Atlanta, GA",
      
      // Timeline context (essential for temporal search)
      "is_target_company_position": true,
      "is_pre_company_position": false,
      "is_during_company_position": false,
      "is_post_company_position": false,
      
      // Slower retrieval fields (detailed context)
      "company_size": "Large",
      "management_responsibility": false,
      "is_leadership_role": false
    },
    
    {
      "event_id": "ce_002",
      "event_type": "promotion",
      "event_timestamp": "2019-06-01T00:00:00Z",
      "sequence_number": 2,
      
      "company": "Chick-fil-A",
      "title": "Shift Leader",
      
      "start_year": 2019,
      "start_month": 6,
      "end_year": 2020,
      "end_month": 12,
      "is_current_position": false,
      
      "industry": "Food Service",
      "job_level": "Mid Level",
      "job_function": "Management",
      "location": "Atlanta, GA",
      
      "is_target_company_position": true,
      "is_pre_company_position": false,
      "is_during_company_position": false,
      "is_post_company_position": false,
      
      // Slower retrieval fields (detailed context)
      "company_size": "Large",
      "management_responsibility": true,
      "is_leadership_role": true
    },
    
    {
      "event_id": "ce_003",
      "event_type": "job_start",
      "event_timestamp": "2021-01-15T00:00:00Z",
      "sequence_number": 3,
      
      "company": "Google",
      "title": "Senior Engineer",
      
      "start_year": 2021,
      "start_month": 1,
      "end_year": 2023,
      "end_month": 8,
      "is_current_position": false,
      
      "industry": "Technology",
      "job_level": "Senior",
      "job_function": "Engineering",
      "location": "Mountain View, CA",
      
      "is_target_company_position": false,
      "is_pre_company_position": false,
      "is_during_company_position": false,
      "is_post_company_position": true,
      
      // Slower retrieval fields (detailed context)
      "company_size": "Large",
      "management_responsibility": false,
      "is_leadership_role": false
    }
  ]
}
```

## Education Events JSON Input Structure

### Education Event Object (Fast Retrieval - Main Table)
```json
{
  "profile_id": 12345,
  "education_events": [
    {
      "event_id": "ee_001",
      "event_type": "enrollment",
      "event_timestamp": "2016-08-15T00:00:00Z",
      "sequence_number": 1,
      
      // Core education details (commonly searched)
      "institution": "The Covenant School",
      "degree": "High School Diploma",
      "degree_level": "High School",
      "field_of_study": "General Studies",
      
      // Precise timing (essential for temporal analysis)
      "start_year": 2016,
      "start_month": 8,
      "end_year": 2020,
      "end_month": 6,
      "graduation_year": 2020,
      "is_current": false,
      
      // Education progression fields (commonly searched)
      "location": "Charlottesville, VA",
      
      // Timeline context (essential for temporal search)
      "is_pre_company_education": true,
      "is_during_company_education": false,
      "is_post_company_education": false,
      
      // Slower retrieval fields (detailed context)
      "gpa": 3.7,
      "honors": ["Honor Roll", "Principal's List"],
      "major": null
    },
    
    {
      "event_id": "ee_002",
      "event_type": "graduation",
      "event_timestamp": "2020-06-15T00:00:00Z",
      "sequence_number": 2,
      
      "institution": "The Covenant School",
      "degree": "High School Diploma",
      "degree_level": "High School",
      "field_of_study": "General Studies",
      
      "start_year": 2016,
      "start_month": 8,
      "end_year": 2020,
      "end_month": 6,
      "graduation_year": 2020,
      "is_current": false,
      
      "location": "Charlottesville, VA",
      
      "is_pre_company_education": true,
      "is_during_company_education": false,
      "is_post_company_education": false,
      
      "gpa": 3.8,
      "honors": ["Magna Cum Laude"],
      "major": null
    },
    
    {
      "event_id": "ee_003",
      "event_type": "enrollment",
      "event_timestamp": "2020-08-20T00:00:00Z",
      "sequence_number": 3,
      
      "institution": "Liberty University",
      "degree": "Bachelor of Science",
      "degree_level": "Bachelor's Degree",
      "field_of_study": "Religion/Religious Studies",
      
      "start_year": 2020,
      "start_month": 8,
      "end_year": 2024,
      "end_month": 5,
      "graduation_year": 2024,
      "is_current": false,
      
      "location": "Lynchburg, VA",
      
      "is_pre_company_education": false,
      "is_during_company_education": false,
      "is_post_company_education": true,
      
      "gpa": 3.65,
      "honors": ["Cum Laude", "Dean's List"],
      "major": "Religious Studies"
    },
    
    {
      "event_id": "ee_004",
      "event_type": "graduation",
      "event_timestamp": "2024-05-15T00:00:00Z",
      "sequence_number": 4,
      
      "institution": "Liberty University",
      "degree": "Bachelor of Science",
      "degree_level": "Bachelor's Degree",
      "field_of_study": "Religion/Religious Studies",
      
      "start_year": 2020,
      "start_month": 8,
      "end_year": 2024,
      "end_month": 5,
      "graduation_year": 2024,
      "is_current": false,
      
      "location": "Lynchburg, VA",
      
      "is_pre_company_education": false,
      "is_during_company_education": false,
      "is_post_company_education": true,
      
      "gpa": 3.65,
      "honors": ["Cum Laude"],
      "major": "Religious Studies"
    }
  ]
}
```

## TypeScript Interfaces for the Input Structures

```typescript
interface CareerEvent {
  event_id: string;
  event_type: 'job_start' | 'job_end' | 'promotion' | 'lateral_move' | 'company_change';
  event_timestamp: string;
  sequence_number: number;
  
  // Core job details (commonly searched)
  company: string;
  title: string;
  
  // Precise timing (essential for temporal analysis)
  start_year: number;
  start_month: number;
  end_year: number;
  end_month: number;
  is_current_position: boolean;
  
  // Career progression fields (commonly searched)
  industry: string;
  job_level: string;
  job_function: string;
  location: string;
  
  // Timeline context (essential for temporal search)
  is_target_company_position: boolean;
  is_pre_company_position: boolean;
  is_during_company_position: boolean;
  is_post_company_position: boolean;
  
  // Slower retrieval fields (detailed context)
  company_size: string;
  management_responsibility: boolean;
  is_leadership_role: boolean;
}

interface EducationEvent {
  event_id: string;
  event_type: 'enrollment' | 'graduation' | 'academic_milestone' | 'transfer' | 'withdrawal';
  event_timestamp: string;
  sequence_number: number;
  
  // Core education details (commonly searched)
  institution: string;
  degree: string;
  degree_level: string;
  field_of_study: string;
  
  // Precise timing (essential for temporal analysis)
  start_year: number;
  start_month: number;
  end_year: number;
  end_month: number;
  graduation_year: number;
  is_current: boolean;
  
  // Education progression fields (commonly searched)
  location: string;
  
  // Timeline context (essential for temporal search)
  is_pre_company_education: boolean;
  is_during_company_education: boolean;
  is_post_company_education: boolean;
  
  // Slower retrieval fields (detailed context)
  gpa?: number;
  honors: string[];
  major?: string;
}

interface ProfileEventsInput {
  profile_id: number;
  career_events: CareerEvent[];
  education_events: EducationEvent[];
}
```

This simplified structure focuses only on the core fields needed for chronological career and education analysis, without the extensive detail fields that were previously included. 

## Pure Chronological Search Function (Event Tables Only)

```sql
CREATE OR REPLACE FUNCTION comprehensive_chronological_search_chick_fil_a(
  -- CAREER FILTERS
  -- Experience accumulation
  min_years_in_industry text DEFAULT NULL,
  min_years_at_level text DEFAULT NULL,
  total_experience_years int DEFAULT NULL,
  
  -- Career progression patterns
  career_progression_pattern text DEFAULT NULL, -- 'management_track', 'individual_contributor', 'leadership_progression'
  industry_transition_pattern text[] DEFAULT NULL, -- ['Finance', 'Technology'] for Finance → Technology
  level_progression_pattern text[] DEFAULT NULL, -- ['Entry Level', 'Mid Level', 'Senior'] for career advancement
  
  -- Career company/location filters
  career_company_filter text DEFAULT NULL,
  career_location_filter text DEFAULT NULL,
  career_industry_filter text DEFAULT NULL,
  career_job_level_filter text DEFAULT NULL,
  
  -- Company progression analysis
  company_size_progression text[] DEFAULT NULL, -- ['Startup', 'Large'] for startup → enterprise
  geographic_mobility boolean DEFAULT FALSE, -- Moved locations for career
  target_company_tenure_min int DEFAULT NULL, -- Min months at target company
  target_company_tenure_max int DEFAULT NULL, -- Max months at target company
  
  -- Timeline context filters
  include_unrelated_positions boolean DEFAULT TRUE, -- Include positions marked as unrelated
  timeline_context_filter text DEFAULT NULL, -- 'target_company', 'pre_company', 'during_company', 'post_company', 'unrelated'
  
  -- EDUCATION FILTERS
  -- Education institution/degree filters
  education_institution_filter text DEFAULT NULL, -- "Rutgers University"
  education_location_filter text DEFAULT NULL, -- "Pittsburgh"
  education_degree_level_filter text DEFAULT NULL, -- "Bachelor's Degree"
  education_degree_name_filter text DEFAULT NULL, -- "Bachelor of Science"
  
  -- Education progression patterns
  degree_progression_pattern text[] DEFAULT NULL, -- ['High School', 'Bachelor\'s Degree', 'Master\'s Degree']
  education_timeline_filter text DEFAULT NULL, -- 'pre_company', 'during_company', 'post_company', 'unrelated'
  
  -- Timeline context filters
  include_unrelated_education boolean DEFAULT TRUE, -- Include education marked as unrelated
  
  -- CROSS-DOMAIN TEMPORAL RELATIONSHIPS
  -- Sequence patterns between education and career
  sequence_pattern text DEFAULT NULL, -- 'education_then_career', 'career_then_education', 'concurrent', 'any'
  max_gap_months int DEFAULT 24, -- Max gap between education end and career start (or vice versa)
  min_gap_months int DEFAULT 0, -- Min gap between events
  
  -- TIMELINE ANALYSIS
  gap_tolerance_months int DEFAULT 6, -- Max acceptable employment gaps
  concurrent_activities boolean DEFAULT FALSE, -- Working while studying
  
  -- RESULT CONFIGURATION
  limit_count int DEFAULT 20,
  order_by text DEFAULT 'chronological_relevance' -- 'chronological_relevance', 'career_progression', 'education_progression', 'total_experience'
)
RETURNS TABLE (
  profile_id bigint,
  name text,
  career_timeline jsonb,
  education_timeline jsonb,
  comprehensive_analysis jsonb,
  
  -- Current state for quick reference (from vector table)
  current_company text,
  current_title text,
  current_industry text,
  current_location text,
  
  -- Career progression metrics (calculated from event tables)
  total_years_experience numeric,
  years_in_target_industry numeric,
  career_progression_score float,
  
  -- Education progression metrics (calculated from event tables)
  highest_degree_level text,
  education_progression_score float,
  
  -- Cross-domain analysis
  timeline_pattern text,
  sequence_gap_months int,
  has_concurrent_activities boolean,
  
  -- Chronological relevance score
  chronological_relevance_score float
) AS $$
BEGIN
  RETURN QUERY
  WITH career_analysis AS (
    SELECT 
      ce.profile_id,
      
      -- Build career timeline JSON
      jsonb_object_agg(
        ce.start_year::text || '_' || ce.start_month::text,
        jsonb_build_object(
          'company', ce.company,
          'title', ce.title,
          'industry', ce.industry,
          'job_level', ce.job_level,
          'location', ce.location,
          'start_year', ce.start_year,
          'start_month', ce.start_month,
          'end_year', ce.end_year,
          'end_month', ce.end_month,
          'is_current', ce.is_current_position,
          'is_target_company', ce.is_target_company_position,
          'is_pre_company', ce.is_pre_company_position,
          'is_during_company', ce.is_during_company_position,
          'is_post_company', ce.is_post_company_position,
          'is_unrelated', ce.is_unrelated_position,
          'company_size', ce.company_size,
          'management_responsibility', ce.management_responsibility,
          'is_leadership_role', ce.is_leadership_role,
          'sequence_number', ce.sequence_number
        )
      ) as career_timeline,
      
      -- Calculate total experience
      SUM(
        CASE WHEN ce.end_year = 9999 THEN 
          (EXTRACT(YEAR FROM NOW()) - ce.start_year) * 12 + 
          (EXTRACT(MONTH FROM NOW()) - ce.start_month)
        ELSE 
          (ce.end_year - ce.start_year) * 12 + (ce.end_month - ce.start_month)
        END
      ) / 12.0 as total_years_experience,
      
      -- Industry experience calculation
      COALESCE(
        SUM(
          CASE WHEN (min_years_in_industry IS NULL OR ce.industry ILIKE '%' || min_years_in_industry || '%') THEN
            CASE WHEN ce.end_year = 9999 THEN 
              (EXTRACT(YEAR FROM NOW()) - ce.start_year) * 12 + 
              (EXTRACT(MONTH FROM NOW()) - ce.start_month)
            ELSE 
              (ce.end_year - ce.start_year) * 12 + (ce.end_month - ce.start_month)
            END
          ELSE 0 END
        ) / 12.0, 0
      ) as years_in_target_industry,
      
      -- Career progression score based on job level changes and leadership roles
      CASE 
        WHEN COUNT(DISTINCT ce.job_level) > 1 THEN
          (COUNT(DISTINCT ce.job_level) - 1) * 0.25 + 
          (CASE WHEN MAX(ce.job_level) ILIKE '%Senior%' OR MAX(ce.job_level) ILIKE '%Lead%' THEN 0.3 ELSE 0 END) +
          (CASE WHEN MAX(ce.job_level) ILIKE '%Manager%' OR MAX(ce.job_level) ILIKE '%Director%' THEN 0.4 ELSE 0 END) +
          (CASE WHEN bool_or(ce.is_leadership_role) THEN 0.2 ELSE 0 END)
        ELSE 0.1
      END as career_progression_score,
      
      -- Target company tenure analysis
      COALESCE(
        SUM(
          CASE WHEN ce.is_target_company_position THEN
            CASE WHEN ce.end_year = 9999 THEN 
              (EXTRACT(YEAR FROM NOW()) - ce.start_year) * 12 + 
              (EXTRACT(MONTH FROM NOW()) - ce.start_month)
            ELSE 
              (ce.end_year - ce.start_year) * 12 + (ce.end_month - ce.start_month)
            END
          ELSE 0 END
        ), 0
      ) as target_company_tenure_months,
      
      -- Career filter matches
      bool_and(
        CASE 
          WHEN career_company_filter IS NOT NULL THEN ce.company ILIKE '%' || career_company_filter || '%'
          ELSE TRUE
        END AND
        CASE 
          WHEN career_location_filter IS NOT NULL THEN ce.location ILIKE '%' || career_location_filter || '%'
          ELSE TRUE
        END AND
        CASE 
          WHEN career_industry_filter IS NOT NULL THEN ce.industry ILIKE '%' || career_industry_filter || '%'
          ELSE TRUE
        END AND
        CASE 
          WHEN career_job_level_filter IS NOT NULL THEN ce.job_level ILIKE '%' || career_job_level_filter || '%'
          ELSE TRUE
        END AND
        CASE 
          WHEN timeline_context_filter IS NOT NULL THEN 
            CASE timeline_context_filter
              WHEN 'target_company' THEN ce.is_target_company_position = TRUE
              WHEN 'pre_company' THEN ce.is_pre_company_position = TRUE
              WHEN 'during_company' THEN ce.is_during_company_position = TRUE
              WHEN 'post_company' THEN ce.is_post_company_position = TRUE
              WHEN 'unrelated' THEN ce.is_unrelated_position = TRUE
              ELSE TRUE
            END
          ELSE TRUE
        END
      ) as matches_career_filters,
      
      -- Latest career end date for cross-domain analysis
      MAX(ce.end_year * 12 + ce.end_month) as latest_career_end_month,
      MIN(ce.start_year * 12 + ce.start_month) as earliest_career_start_month,
      
      -- Geographic mobility check
      COUNT(DISTINCT ce.location) > 1 as has_geographic_mobility,
      
      -- Company size progression check
      CASE 
        WHEN company_size_progression IS NOT NULL THEN
          bool_and(ce.company_size = ANY(company_size_progression))
        ELSE TRUE
      END as matches_company_size_progression
      
    FROM chick_fil_a_alumni_career_events ce
    WHERE 
      -- Apply unrelated position filter
      (include_unrelated_positions = TRUE OR ce.is_unrelated_position = FALSE)
    GROUP BY ce.profile_id
  ),
  
  education_analysis AS (
    SELECT 
      ee.profile_id,
      
      -- Build education timeline JSON
      jsonb_object_agg(
        ee.start_year::text || '_' || ee.start_month::text,
        jsonb_build_object(
          'institution', ee.institution,
          'degree_name', ee.degree_name,
          'degree_level', ee.degree_level,
          'location', ee.location,
          'start_year', ee.start_year,
          'start_month', ee.start_month,
          'end_year', ee.end_year,
          'end_month', ee.end_month,
          'graduation_year', ee.graduation_year,
          'is_current', ee.is_current,
          'is_pre_company', ee.is_pre_company_education,
          'is_during_company', ee.is_during_company_education,
          'is_post_company', ee.is_post_company_education,
          'is_unrelated', ee.is_unrelated_education,
          'grade', ee.grade,
          'sequence_number', ee.sequence_number
        )
      ) as education_timeline,
      
      -- Education progression analysis
      CASE 
        WHEN MAX(ee.degree_level) ILIKE '%PhD%' OR MAX(ee.degree_level) ILIKE '%Doctorate%' THEN 'Doctorate'
        WHEN MAX(ee.degree_level) ILIKE '%Master%' THEN 'Master\'s'
        WHEN MAX(ee.degree_level) ILIKE '%Bachelor%' THEN 'Bachelor\'s'
        WHEN MAX(ee.degree_level) ILIKE '%Associate%' THEN 'Associate'
        ELSE 'High School'
      END as highest_degree_level,
      
      -- Education progression score
      CASE 
        WHEN COUNT(DISTINCT ee.degree_level) >= 3 THEN 1.0  -- High School → Bachelor's → Master's
        WHEN COUNT(DISTINCT ee.degree_level) = 2 THEN 0.7   -- Two distinct levels
        ELSE 0.3
      END as education_progression_score,
      
      -- Education filter matches
      bool_and(
        CASE 
          WHEN education_institution_filter IS NOT NULL THEN ee.institution ILIKE '%' || education_institution_filter || '%'
          ELSE TRUE
        END AND
        CASE 
          WHEN education_location_filter IS NOT NULL THEN ee.location ILIKE '%' || education_location_filter || '%'
          ELSE TRUE
        END AND
        CASE 
          WHEN education_degree_level_filter IS NOT NULL THEN ee.degree_level ILIKE '%' || education_degree_level_filter || '%'
          ELSE TRUE
        END AND
        CASE 
          WHEN education_degree_name_filter IS NOT NULL THEN ee.degree_name ILIKE '%' || education_degree_name_filter || '%'
          ELSE TRUE
        END AND
        CASE 
          WHEN education_timeline_filter IS NOT NULL THEN 
            CASE education_timeline_filter
              WHEN 'pre_company' THEN ee.is_pre_company_education = TRUE
              WHEN 'during_company' THEN ee.is_during_company_education = TRUE
              WHEN 'post_company' THEN ee.is_post_company_education = TRUE
              WHEN 'unrelated' THEN ee.is_unrelated_education = TRUE
              ELSE TRUE
            END
          ELSE TRUE
        END
      ) as matches_education_filters,
      
      -- Latest education end date for cross-domain analysis
      MAX(ee.end_year * 12 + ee.end_month) as latest_education_end_month,
      MIN(ee.start_year * 12 + ee.start_month) as earliest_education_start_month
      
    FROM chick_fil_a_alumni_education_events ee
    WHERE 
      -- Apply unrelated education filter
      (include_unrelated_education = TRUE OR ee.is_unrelated_education = FALSE)
    GROUP BY ee.profile_id
  ),
  
  cross_domain_analysis AS (
    SELECT 
      COALESCE(ca.profile_id, ea.profile_id) as profile_id,
      ca.career_timeline,
      ea.education_timeline,
      ca.total_years_experience,
      ca.years_in_target_industry,
      ca.career_progression_score,
      ca.target_company_tenure_months,
      ea.highest_degree_level,
      ea.education_progression_score,
      ca.has_geographic_mobility,
      ca.matches_company_size_progression,
      
      -- Cross-domain sequence analysis
      CASE 
        WHEN sequence_pattern = 'education_then_career' THEN
          CASE 
            WHEN ea.latest_education_end_month IS NOT NULL AND ca.earliest_career_start_month IS NOT NULL 
                 AND ea.latest_education_end_month <= ca.earliest_career_start_month THEN 'education_then_career'
            ELSE 'invalid_sequence'
          END
        WHEN sequence_pattern = 'career_then_education' THEN
          CASE 
            WHEN ca.latest_career_end_month IS NOT NULL AND ea.earliest_education_start_month IS NOT NULL
                 AND ca.latest_career_end_month <= ea.earliest_education_start_month THEN 'career_then_education'
            ELSE 'invalid_sequence'
          END
        WHEN sequence_pattern = 'concurrent' THEN
          CASE 
            WHEN (ea.earliest_education_start_month IS NOT NULL AND ca.latest_career_end_month IS NOT NULL AND
                  ca.earliest_career_start_month IS NOT NULL AND ea.latest_education_end_month IS NOT NULL AND
                  ea.earliest_education_start_month <= ca.latest_career_end_month AND 
                  ca.earliest_career_start_month <= ea.latest_education_end_month) THEN 'concurrent'
            ELSE 'invalid_sequence'
          END
        ELSE 'any'
      END as timeline_pattern,
      
      -- Calculate gap between education and career
      CASE 
        WHEN sequence_pattern = 'education_then_career' AND ea.latest_education_end_month IS NOT NULL AND ca.earliest_career_start_month IS NOT NULL THEN 
          ca.earliest_career_start_month - ea.latest_education_end_month
        WHEN sequence_pattern = 'career_then_education' AND ca.latest_career_end_month IS NOT NULL AND ea.earliest_education_start_month IS NOT NULL THEN 
          ea.earliest_education_start_month - ca.latest_career_end_month
        ELSE 0
      END as sequence_gap_months,
      
      -- Concurrent activities detection
      CASE 
        WHEN ea.earliest_education_start_month IS NOT NULL AND ca.latest_career_end_month IS NOT NULL AND
             ca.earliest_career_start_month IS NOT NULL AND ea.latest_education_end_month IS NOT NULL THEN
          (ea.earliest_education_start_month <= ca.latest_career_end_month AND 
           ca.earliest_career_start_month <= ea.latest_education_end_month)
        ELSE FALSE
      END as has_concurrent_activities,
      
      -- Filter matches
      COALESCE(ca.matches_career_filters, TRUE) as matches_career_filters,
      COALESCE(ea.matches_education_filters, TRUE) as matches_education_filters,
      
      -- Calculate chronological relevance score
      (
        -- Career progression weight (40%)
        COALESCE(ca.career_progression_score, 0) * 0.4 +
        -- Education progression weight (30%)
        COALESCE(ea.education_progression_score, 0) * 0.3 +
        -- Sequence pattern match weight (20%)
        CASE 
          WHEN sequence_pattern IS NULL THEN 0.2
          WHEN sequence_pattern = 'education_then_career' AND ea.latest_education_end_month <= ca.earliest_career_start_month THEN 0.2
          WHEN sequence_pattern = 'career_then_education' AND ca.latest_career_end_month <= ea.earliest_education_start_month THEN 0.2
          WHEN sequence_pattern = 'concurrent' AND (ea.earliest_education_start_month <= ca.latest_career_end_month AND ca.earliest_career_start_month <= ea.latest_education_end_month) THEN 0.2
          ELSE 0
        END +
        -- Total experience weight (10%)
        LEAST(COALESCE(ca.total_years_experience, 0) / 20.0, 1.0) * 0.1
      ) as chronological_relevance_score
      
    FROM career_analysis ca
    FULL OUTER JOIN education_analysis ea ON ca.profile_id = ea.profile_id
    WHERE 
      -- Apply cross-domain sequence constraints
      (sequence_pattern IS NULL OR 
       CASE sequence_pattern
         WHEN 'education_then_career' THEN 
           ea.latest_education_end_month IS NOT NULL AND ca.earliest_career_start_month IS NOT NULL AND
           ea.latest_education_end_month <= ca.earliest_career_start_month
         WHEN 'career_then_education' THEN 
           ca.latest_career_end_month IS NOT NULL AND ea.earliest_education_start_month IS NOT NULL AND
           ca.latest_career_end_month <= ea.earliest_education_start_month
         WHEN 'concurrent' THEN 
           ea.earliest_education_start_month IS NOT NULL AND ca.latest_career_end_month IS NOT NULL AND
           ca.earliest_career_start_month IS NOT NULL AND ea.latest_education_end_month IS NOT NULL AND
           (ea.earliest_education_start_month <= ca.latest_career_end_month AND 
            ca.earliest_career_start_month <= ea.latest_education_end_month)
         ELSE TRUE
       END)
      
      -- Apply gap constraints
      AND (max_gap_months IS NULL OR ABS(
        CASE 
          WHEN sequence_pattern = 'education_then_career' AND ea.latest_education_end_month IS NOT NULL AND ca.earliest_career_start_month IS NOT NULL THEN 
            ca.earliest_career_start_month - ea.latest_education_end_month
          WHEN sequence_pattern = 'career_then_education' AND ca.latest_career_end_month IS NOT NULL AND ea.earliest_education_start_month IS NOT NULL THEN 
            ea.earliest_education_start_month - ca.latest_career_end_month
          ELSE 0
        END
      ) <= max_gap_months)
      
      AND (min_gap_months IS NULL OR ABS(
        CASE 
          WHEN sequence_pattern = 'education_then_career' AND ea.latest_education_end_month IS NOT NULL AND ca.earliest_career_start_month IS NOT NULL THEN 
            ca.earliest_career_start_month - ea.latest_education_end_month
          WHEN sequence_pattern = 'career_then_education' AND ca.latest_career_end_month IS NOT NULL AND ea.earliest_education_start_month IS NOT NULL THEN 
            ea.earliest_education_start_month - ca.latest_career_end_month
          ELSE 0
        END
      ) >= min_gap_months)
      
      -- Apply experience filters
      AND (total_experience_years IS NULL OR COALESCE(ca.total_years_experience, 0) >= total_experience_years)
      AND (min_years_in_industry IS NULL OR COALESCE(ca.years_in_target_industry, 0) >= 
           CASE min_years_in_industry 
             WHEN '1+' THEN 1 WHEN '2+' THEN 2 WHEN '3+' THEN 3 
             WHEN '5+' THEN 5 WHEN '10+' THEN 10 ELSE 0 END)
      
      -- Apply tenure constraints
      AND (target_company_tenure_min IS NULL OR COALESCE(ca.target_company_tenure_months, 0) >= target_company_tenure_min)
      AND (target_company_tenure_max IS NULL OR COALESCE(ca.target_company_tenure_months, 999999) <= target_company_tenure_max)
      
      -- Apply filter matches
      AND COALESCE(ca.matches_career_filters, TRUE) = TRUE
      AND COALESCE(ea.matches_education_filters, TRUE) = TRUE
      
      -- Apply geographic mobility filter
      AND (geographic_mobility IS FALSE OR COALESCE(ca.has_geographic_mobility, FALSE) = geographic_mobility)
      
      -- Apply concurrent activities filter
      AND (concurrent_activities IS FALSE OR 
           CASE 
             WHEN ea.earliest_education_start_month IS NOT NULL AND ca.latest_career_end_month IS NOT NULL AND
                  ca.earliest_career_start_month IS NOT NULL AND ea.latest_education_end_month IS NOT NULL THEN
               (ea.earliest_education_start_month <= ca.latest_career_end_month AND 
                ca.earliest_career_start_month <= ea.latest_education_end_month) = concurrent_activities
             ELSE concurrent_activities = FALSE
           END)
  )
  
  SELECT 
    cda.profile_id,
    COALESCE(av.name, 'Unknown') as name,
    COALESCE(cda.career_timeline, '{}'::jsonb) as career_timeline,
    COALESCE(cda.education_timeline, '{}'::jsonb) as education_timeline,
    jsonb_build_object(
      'total_years_experience', cda.total_years_experience,
      'years_in_target_industry', cda.years_in_target_industry,
      'career_progression_score', cda.career_progression_score,
      'education_progression_score', cda.education_progression_score,
      'timeline_pattern', cda.timeline_pattern,
      'sequence_gap_months', cda.sequence_gap_months,
      'has_concurrent_activities', cda.has_concurrent_activities,
      'target_company_tenure_months', cda.target_company_tenure_months,
      'has_geographic_mobility', cda.has_geographic_mobility,
      'chronological_relevance_score', cda.chronological_relevance_score
    ) as comprehensive_analysis,
    COALESCE(av.post_company_current_company, 'Unknown') as current_company,
    COALESCE(av.post_company_current_title, 'Unknown') as current_title,
    COALESCE(av.post_company_current_industry, 'Unknown') as current_industry,
    COALESCE(av.post_company_current_location, 'Unknown') as current_location,
    cda.total_years_experience,
    cda.years_in_target_industry,
    cda.career_progression_score,
    cda.highest_degree_level,
    cda.education_progression_score,
    cda.timeline_pattern,
    cda.sequence_gap_months::int,
    cda.has_concurrent_activities,
    cda.chronological_relevance_score
  FROM cross_domain_analysis cda
  LEFT JOIN chick_fil_a_alumni_vector av ON cda.profile_id = av.profile_id
  ORDER BY 
    CASE order_by
      WHEN 'chronological_relevance' THEN cda.chronological_relevance_score
      WHEN 'career_progression' THEN cda.career_progression_score
      WHEN 'education_progression' THEN cda.education_progression_score
      WHEN 'total_experience' THEN cda.total_years_experience::float
      ELSE cda.chronological_relevance_score
    END DESC
  LIMIT limit_count;
  
END;
$$ LANGUAGE plpgsql;

-- Add documentation
COMMENT ON FUNCTION comprehensive_chronological_search_chick_fil_a IS 'Pure chronological search function analyzing temporal relationships between career and education events. No semantic similarity - focuses on metadata filtering and timeline analysis.';

## Pure Chronological Example Queries

```sql
-- "Find someone who worked at Chick-fil-A then went to school at Rutgers University"
SELECT * FROM comprehensive_chronological_search_chick_fil_a(
  career_company_filter := 'Chick-fil-A',
  education_institution_filter := 'Rutgers University',
  sequence_pattern := 'career_then_education',
  max_gap_months := 12,
  include_unrelated_positions := FALSE,
  include_unrelated_education := FALSE,
  limit_count := 20
);

-- "Find people who got Bachelor's degrees then worked in management roles"
SELECT * FROM comprehensive_chronological_search_chick_fil_a(
  education_degree_level_filter := 'Bachelor',
  career_job_level_filter := 'Manager',
  sequence_pattern := 'education_then_career',
  max_gap_months := 6,
  career_progression_pattern := 'management_track',
  limit_count := 20
);

-- "Find people who worked while going to school (concurrent activities)"
SELECT * FROM comprehensive_chronological_search_chick_fil_a(
  sequence_pattern := 'concurrent',
  concurrent_activities := TRUE,
  include_unrelated_positions := TRUE,
  include_unrelated_education := TRUE,
  limit_count := 20
);

-- "Find people who moved locations for their career and have 5+ years experience"
SELECT * FROM comprehensive_chronological_search_chick_fil_a(
  geographic_mobility := TRUE,
  total_experience_years := 5,
  order_by := 'total_experience',
  limit_count := 20
);

-- "Find people who worked at target company for 2+ years then got advanced degrees"
SELECT * FROM comprehensive_chronological_search_chick_fil_a(
  timeline_context_filter := 'target_company',
  target_company_tenure_min := 24, -- 2 years in months
  education_degree_level_filter := 'Master',
  education_timeline_filter := 'post_company',
  sequence_pattern := 'career_then_education',
  limit_count := 20
);
```

## Optimized Chronological Search Function (LLM Pipeline Integration)

```sql
CREATE OR REPLACE FUNCTION llm_integrated_chronological_search_chick_fil_a(
  -- LLM PIPELINE INPUTS
  chronological_filters jsonb DEFAULT '{}',  -- Output from translateWithoutClassificationContext
  weight_assignment jsonb DEFAULT '{}',      -- Output from weight assignment LLM
  
  -- ADDITIONAL SEARCH PARAMETERS
  limit_count int DEFAULT 20,
  organization_name text DEFAULT 'chick_fil_a'
)
RETURNS TABLE (
  profile_id bigint,
  name text,
  career_timeline jsonb,
  education_timeline jsonb,
  comprehensive_analysis jsonb,
  
  -- Current state for quick reference (from vector table)
  current_company text,
  current_title text,
  current_industry text,
  current_location text,
  
  -- Career progression metrics (calculated from event tables)
  total_years_experience numeric,
  years_in_target_industry numeric,
  career_progression_score float,
  
  -- Education progression metrics (calculated from event tables)
  highest_degree_level text,
  education_progression_score float,
  
  -- Cross-domain analysis
  timeline_pattern text,
  sequence_gap_months int,
  has_concurrent_activities boolean,
  
  -- Dynamic chronological relevance score using LLM weights
  chronological_relevance_score float
) AS $$
DECLARE
  -- Extract LLM weights with defaults
  weight_career_quality numeric := COALESCE((weight_assignment->>'career_quality')::numeric, 0.4);
  weight_education_quality numeric := COALESCE((weight_assignment->>'education_quality')::numeric, 0.25);
  weight_timeline_precision numeric := COALESCE((weight_assignment->>'timeline_precision')::numeric, 0.25);
  weight_filter_specificity numeric := COALESCE((weight_assignment->>'filter_specificity')::numeric, 0.1);
  
  -- Extract filter values with fallbacks
  min_years_in_industry numeric := COALESCE((chronological_filters->>'min_years_in_industry')::numeric, NULL);
  min_years_in_function numeric := COALESCE((chronological_filters->>'min_years_in_function')::numeric, NULL);
  total_experience_years numeric := COALESCE((chronological_filters->>'total_experience_years')::numeric, NULL);
  career_progression_pattern text := chronological_filters->>'career_progression_pattern';
  gap_tolerance numeric := COALESCE((chronological_filters->>'gap_tolerance')::numeric, 6);
  concurrent_activities boolean := COALESCE((chronological_filters->>'concurrent_activities')::boolean, FALSE);
  geographic_mobility boolean := COALESCE((chronological_filters->>'geographic_mobility')::boolean, FALSE);
  
  -- Education filters
  degree_level_progression jsonb := chronological_filters->'degree_level_progression';
  education_industry_alignment boolean := COALESCE((chronological_filters->>'education_industry_alignment')::boolean, FALSE);
  
  -- Industry and company transitions
  industry_transitions jsonb := chronological_filters->'industry_transitions';
  company_size_progression jsonb := chronological_filters->'company_size_progression';
  
  -- Dynamic table name based on organization
  career_events_table text := organization_name || '_alumni_career_events';
  education_events_table text := organization_name || '_alumni_education_events';
  vector_table text := organization_name || '_alumni_vector';
BEGIN
  RETURN QUERY
  EXECUTE format('
  WITH career_analysis AS (
    SELECT 
      ce.profile_id,
      
      -- Build career timeline JSON
      jsonb_object_agg(
        ce.start_year::text || ''_'' || ce.start_month::text,
        jsonb_build_object(
          ''company'', ce.company,
          ''title'', ce.title,
          ''industry'', ce.industry,
          ''job_level'', ce.job_level,
          ''location'', ce.location,
          ''start_year'', ce.start_year,
          ''start_month'', ce.start_month,
          ''end_year'', ce.end_year,
          ''end_month'', ce.end_month,
          ''is_current'', ce.is_current_position,
          ''company_size'', ce.company_size,
          ''management_responsibility'', ce.management_responsibility,
          ''is_leadership_role'', ce.is_leadership_role,
          ''sequence_number'', ce.sequence_number
        )
      ) as career_timeline,
      
      -- Calculate total experience
      SUM(
        CASE WHEN ce.end_year = 9999 THEN 
          (EXTRACT(YEAR FROM NOW()) - ce.start_year) * 12 + 
          (EXTRACT(MONTH FROM NOW()) - ce.start_month)
        ELSE 
          (ce.end_year - ce.start_year) * 12 + (ce.end_month - ce.start_month)
        END
      ) / 12.0 as total_years_experience,
      
      -- Industry experience calculation
      COALESCE(
        SUM(
          CASE WHEN ($3 IS NULL OR ce.industry ILIKE ''%%'' || $3 || ''%%'') THEN
            CASE WHEN ce.end_year = 9999 THEN 
              (EXTRACT(YEAR FROM NOW()) - ce.start_year) * 12 + 
              (EXTRACT(MONTH FROM NOW()) - ce.start_month)
            ELSE 
              (ce.end_year - ce.start_year) * 12 + (ce.end_month - ce.start_month)
            END
          ELSE 0 END
        ) / 12.0, 0
      ) as years_in_target_industry,
      
      -- Career progression score based on patterns and leadership
      CASE 
        WHEN $4 IS NOT NULL THEN
          CASE $4
            WHEN ''individual_contributor_to_management'' THEN
              CASE WHEN bool_or(ce.is_leadership_role) AND bool_or(NOT ce.management_responsibility) THEN 1.0 ELSE 0.3 END
            WHEN ''entry_level_to_senior'' THEN
              CASE WHEN MAX(ce.job_level) ILIKE ''%%Senior%%'' OR MAX(ce.job_level) ILIKE ''%%Lead%%'' THEN 0.9 ELSE 0.4 END
            WHEN ''startup_to_enterprise'' THEN
              CASE WHEN bool_and(ce.company_size IN (''Startup'', ''Large'')) THEN 0.8 ELSE 0.3 END
            WHEN ''rapid_advancement'' THEN
              CASE WHEN COUNT(DISTINCT ce.job_level) >= 3 THEN 1.0 ELSE 0.5 END
            ELSE 0.5
          END
        ELSE
          -- Default progression scoring
          CASE 
            WHEN COUNT(DISTINCT ce.job_level) > 1 THEN
              (COUNT(DISTINCT ce.job_level) - 1) * 0.25 + 
              (CASE WHEN bool_or(ce.is_leadership_role) THEN 0.3 ELSE 0 END)
            ELSE 0.2
          END
      END as career_progression_score,
      
      -- Geographic mobility check
      COUNT(DISTINCT ce.location) > 1 as has_geographic_mobility,
      
      -- Latest and earliest career dates for timeline analysis
      MAX(ce.end_year * 12 + ce.end_month) as latest_career_end_month,
      MIN(ce.start_year * 12 + ce.start_month) as earliest_career_start_month
      
    FROM %I ce
    GROUP BY ce.profile_id
  ),
  
  education_analysis AS (
    SELECT 
      ee.profile_id,
      
      -- Build education timeline JSON
      jsonb_object_agg(
        ee.start_year::text || ''_'' || ee.start_month::text,
        jsonb_build_object(
          ''institution'', ee.institution,
          ''degree'', ee.degree,
          ''degree_level'', ee.degree_level,
          ''location'', ee.location,
          ''start_year'', ee.start_year,
          ''start_month'', ee.start_month,
          ''end_year'', ee.end_year,
          ''end_month'', ee.end_month,
          ''graduation_year'', ee.graduation_year,
          ''is_current'', ee.is_current,
          ''sequence_number'', ee.sequence_number
        )
      ) as education_timeline,
      
      -- Highest degree level analysis
      CASE 
        WHEN MAX(ee.degree_level) ILIKE ''%%PhD%%'' OR MAX(ee.degree_level) ILIKE ''%%Doctorate%%'' THEN ''Doctorate''
        WHEN MAX(ee.degree_level) ILIKE ''%%Master%%'' THEN ''Master''''s''
        WHEN MAX(ee.degree_level) ILIKE ''%%Bachelor%%'' THEN ''Bachelor''''s''
        WHEN MAX(ee.degree_level) ILIKE ''%%Associate%%'' THEN ''Associate''
        ELSE ''High School''
      END as highest_degree_level,
      
      -- Education progression score with LLM pattern matching
      CASE 
        WHEN $6 IS NOT NULL THEN
          -- Check if actual progression matches expected pattern
          CASE WHEN jsonb_array_length($6) > 0 THEN
            CASE 
              WHEN COUNT(DISTINCT ee.degree_level) >= jsonb_array_length($6) THEN 1.0
              ELSE COUNT(DISTINCT ee.degree_level)::float / jsonb_array_length($6)
            END
          ELSE 0.5
          END
        ELSE
          -- Default progression scoring
          CASE 
            WHEN COUNT(DISTINCT ee.degree_level) >= 3 THEN 1.0  
            WHEN COUNT(DISTINCT ee.degree_level) = 2 THEN 0.7   
            ELSE 0.3
          END
      END as education_progression_score,
      
      -- Latest and earliest education dates for timeline analysis
      MAX(ee.end_year * 12 + ee.end_month) as latest_education_end_month,
      MIN(ee.start_year * 12 + ee.start_month) as earliest_education_start_month
      
    FROM %I ee
    GROUP BY ee.profile_id
  ),
  
  cross_domain_analysis AS (
    SELECT 
      COALESCE(ca.profile_id, ea.profile_id) as profile_id,
      ca.career_timeline,
      ea.education_timeline,
      ca.total_years_experience,
      ca.years_in_target_industry,
      ca.career_progression_score,
      ea.highest_degree_level,
      ea.education_progression_score,
      ca.has_geographic_mobility,
      
      -- Timeline pattern analysis
      CASE 
        WHEN ea.latest_education_end_month IS NOT NULL AND ca.earliest_career_start_month IS NOT NULL THEN
          CASE 
            WHEN ea.latest_education_end_month <= ca.earliest_career_start_month THEN ''education_then_career''
            WHEN ca.latest_career_end_month <= ea.earliest_education_start_month THEN ''career_then_education''
            WHEN (ea.earliest_education_start_month <= ca.latest_career_end_month AND 
                  ca.earliest_career_start_month <= ea.latest_education_end_month) THEN ''concurrent''
            ELSE ''mixed''
          END
        ELSE ''insufficient_data''
      END as timeline_pattern,
      
      -- Calculate gap between education and career
      CASE 
        WHEN ea.latest_education_end_month IS NOT NULL AND ca.earliest_career_start_month IS NOT NULL THEN 
          ABS(ca.earliest_career_start_month - ea.latest_education_end_month)
        ELSE 0
      END as sequence_gap_months,
      
      -- Concurrent activities detection
      CASE 
        WHEN ea.earliest_education_start_month IS NOT NULL AND ca.latest_career_end_month IS NOT NULL AND
             ca.earliest_career_start_month IS NOT NULL AND ea.latest_education_end_month IS NOT NULL THEN
          (ea.earliest_education_start_month <= ca.latest_career_end_month AND 
           ca.earliest_career_start_month <= ea.latest_education_end_month)
        ELSE FALSE
      END as has_concurrent_activities,
      
      -- DYNAMIC CHRONOLOGICAL RELEVANCE SCORE using LLM weights
      (
        -- Career quality component (dynamic weight)
        COALESCE(ca.career_progression_score, 0) * $7 +
        
        -- Education quality component (dynamic weight)
        COALESCE(ea.education_progression_score, 0) * $8 +
        
        -- Timeline precision component (dynamic weight)
        CASE 
          WHEN $5 IS NOT NULL THEN -- gap_tolerance provided
            CASE WHEN ABS(COALESCE(ca.earliest_career_start_month, 0) - COALESCE(ea.latest_education_end_month, 0)) <= $5 THEN 1.0 ELSE 0.3 END
          ELSE 0.7 -- Default timeline score
        END * $9 +
        
        -- Filter specificity component (dynamic weight)
        CASE 
          WHEN ca.total_years_experience IS NOT NULL AND ea.highest_degree_level IS NOT NULL THEN 1.0
          WHEN ca.total_years_experience IS NOT NULL OR ea.highest_degree_level IS NOT NULL THEN 0.7
          ELSE 0.4
        END * $10
      ) as chronological_relevance_score
      
    FROM career_analysis ca
    FULL OUTER JOIN education_analysis ea ON ca.profile_id = ea.profile_id
    WHERE 
      -- Apply experience filters
      ($2 IS NULL OR COALESCE(ca.total_years_experience, 0) >= $2)
      AND ($3 IS NULL OR COALESCE(ca.years_in_target_industry, 0) >= $3)
      AND ($11 IS FALSE OR COALESCE(ca.has_geographic_mobility, FALSE) = $11)
      AND ($12 IS FALSE OR 
           CASE 
             WHEN ea.earliest_education_start_month IS NOT NULL AND ca.latest_career_end_month IS NOT NULL AND
                  ca.earliest_career_start_month IS NOT NULL AND ea.latest_education_end_month IS NOT NULL THEN
               (ea.earliest_education_start_month <= ca.latest_career_end_month AND 
                ca.earliest_career_start_month <= ea.latest_education_end_month) = $12
             ELSE $12 = FALSE
           END)
  )
  
  SELECT 
    cda.profile_id,
    COALESCE(av.name, ''Unknown'') as name,
    COALESCE(cda.career_timeline, ''{}''::jsonb) as career_timeline,
    COALESCE(cda.education_timeline, ''{}''::jsonb) as education_timeline,
    jsonb_build_object(
      ''total_years_experience'', cda.total_years_experience,
      ''years_in_target_industry'', cda.years_in_target_industry,
      ''career_progression_score'', cda.career_progression_score,
      ''education_progression_score'', cda.education_progression_score,
      ''timeline_pattern'', cda.timeline_pattern,
      ''sequence_gap_months'', cda.sequence_gap_months,
      ''has_concurrent_activities'', cda.has_concurrent_activities,
      ''has_geographic_mobility'', cda.has_geographic_mobility,
      ''chronological_relevance_score'', cda.chronological_relevance_score,
      ''applied_weights'', jsonb_build_object(
        ''career_quality'', $7,
        ''education_quality'', $8,
        ''timeline_precision'', $9,
        ''filter_specificity'', $10
      ),
      ''applied_filters'', $1
    ) as comprehensive_analysis,
    COALESCE(av.post_company_current_company, ''Unknown'') as current_company,
    COALESCE(av.post_company_current_title, ''Unknown'') as current_title,
    COALESCE(av.post_company_current_industry, ''Unknown'') as current_industry,
    COALESCE(av.post_company_current_location, ''Unknown'') as current_location,
    cda.total_years_experience,
    cda.years_in_target_industry,
    cda.career_progression_score,
    cda.highest_degree_level,
    cda.education_progression_score,
    cda.timeline_pattern,
    cda.sequence_gap_months::int,
    cda.has_concurrent_activities,
    cda.chronological_relevance_score
  FROM cross_domain_analysis cda
  LEFT JOIN %I av ON cda.profile_id = av.profile_id
  ORDER BY cda.chronological_relevance_score DESC
  LIMIT $13
  ', 
  career_events_table, 
  education_events_table, 
  vector_table
  ) 
  USING 
    chronological_filters,           -- $1
    total_experience_years,          -- $2 
    min_years_in_industry,           -- $3
    career_progression_pattern,      -- $4
    gap_tolerance,                   -- $5
    degree_level_progression,        -- $6
    weight_career_quality,           -- $7
    weight_education_quality,        -- $8  
    weight_timeline_precision,       -- $9
    weight_filter_specificity,       -- $10
    geographic_mobility,             -- $11
    concurrent_activities,           -- $12
    limit_count;                     -- $13
    
END;
$$ LANGUAGE plpgsql;

-- Add documentation
COMMENT ON FUNCTION llm_integrated_chronological_search_chick_fil_a IS 'LLM-integrated chronological search accepting structured JSON outputs from the chronological pipeline: filters from translateWithoutClassificationContext and dynamic weights from the weight assignment step.';

## Usage Examples with LLM Pipeline Integration

```sql
-- Example 1: Using LLM pipeline outputs directly
SELECT * FROM llm_integrated_chronological_search_chick_fil_a(
  chronological_filters := '{
    "min_years_in_function": 10,
    "career_progression_pattern": "individual_contributor_to_management",
    "gap_tolerance": 6,
    "geographic_mobility": false
  }',
  weight_assignment := '{
    "career_quality": 0.7,
    "education_quality": 0.1,
    "timeline_precision": 0.15,
    "filter_specificity": 0.05
  }',
  limit_count := 20
);

-- Example 2: MBA graduates to executives with custom weights
SELECT * FROM llm_integrated_chronological_search_chick_fil_a(
  chronological_filters := '{
    "degree_level_progression": ["Bachelor", "Master"],
    "career_progression_pattern": "entry_level_to_senior",
    "education_industry_alignment": true,
    "gap_tolerance": 12
  }',
  weight_assignment := '{
    "career_quality": 0.4,
    "education_quality": 0.35,
    "timeline_precision": 0.2,
    "filter_specificity": 0.05
  }',
  limit_count := 15
);

-- Example 3: Default weights fallback (when LLM fails)
SELECT * FROM llm_integrated_chronological_search_chick_fil_a(
  chronological_filters := '{
    "min_years_in_industry": 5,
    "company_size_progression": ["large", "startup"],
    "industry_transitions": ["technology"],
    "gap_tolerance": 12
  }',
  weight_assignment := '{}', -- Empty weights will use defaults
  limit_count := 25
);
```