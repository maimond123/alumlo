# Complete Integration: Natural Language → LLM Weight Assignment → SQL Execution

## How the Four Weight Dimensions Work with Your Schema

### 1. **CAREER_QUALITY** (Experience + Progression + Leadership)
**Schema fields leveraged:**
- `total_years_experience` calculated from `start_year/month` to `end_year/month`
- `distinct_job_levels` progression from your `job_level` field
- `management_responsibility` and `is_leadership_role` boolean flags
- `distinct_industries` and `distinct_locations` for career breadth

**Scoring formula:**
```sql
LEAST(1.0, (
  -- Experience component (0-0.4): 20 years = max score
  LEAST(total_years_experience / 20.0, 0.4) +
  -- Progression component (0-0.3): each job level change = 0.1
  LEAST((distinct_job_levels - 1) * 0.1, 0.3) +
  -- Leadership component (0-0.3): management + leadership roles
  LEAST((management_positions * 0.1 + leadership_positions * 0.1), 0.3)
))
```

### 2. **EDUCATION_QUALITY** (Degree Level + Progression)
**Schema fields leveraged:**
- `degree_level` mapped to quality scores (PhD=0.7, Master's=0.6, Bachelor's=0.4, etc.)
- `distinct_degree_levels` for progression scoring
- `institution` names for potential prestige scoring

**Scoring formula:**
```sql
LEAST(1.0, (
  -- Degree level component (0-0.7)
  CASE highest_degree_level
    WHEN 'Doctorate' THEN 0.7
    WHEN 'Master's' THEN 0.6
    WHEN 'Bachelor's' THEN 0.4
    WHEN 'Associate' THEN 0.2
    ELSE 0.1
  END +
  -- Progression component (0-0.3): each degree level change = 0.15
  LEAST((distinct_degree_levels - 1) * 0.15, 0.3)
))
```

### 3. **TIMELINE_PRECISION** (Sequence Matching + Gap Analysis)
**Schema fields leveraged:**
- Timeline context flags (`is_pre_company_education`, `is_post_company_position`, etc.)
- Date calculations for gap analysis and overlap detection
- `sequence_number` for ordering verification

**Scoring formula:**
```sql
CASE sequence_pattern
  WHEN 'education_then_career' THEN
    -- Score decreases as gap increases (24 months = 0 score)
    GREATEST(0, 1.0 - ABS(career_start_month - education_end_month) / 24.0)
  WHEN 'career_then_education' THEN
    GREATEST(0, 1.0 - ABS(education_start_month - career_end_month) / 24.0)
  WHEN 'concurrent' THEN
    -- High score if overlapping timelines detected
    CASE WHEN (overlapping_periods) THEN 0.9 ELSE 0 END
  ELSE 0.5 -- 'any' pattern gets neutral score
END
```

### 4. **FILTER_SPECIFICITY** (Exact Matches to Specific Criteria)
**Schema fields leveraged:**
- Exact matching on `company`, `institution`, `title`, `industry`, `location`
- Count of specific filter matches across career and education events

**Scoring formula:**
```sql
LEAST(1.0, (
  career_filter_matches * 0.1 + 
  education_filter_matches * 0.1
))
```

## End-to-End Example Workflows

### Example 1: Experience-Focused Query

**Natural Language Input:**
> "Find people with 10+ years of experience in technology who became senior leaders"

**LLM Weight Assignment:**
```json
{
  "weights": {
    "career_quality": 0.65,        // High: experience + leadership focus
    "education_quality": 0.1,      // Low: no education mentioned
    "timeline_precision": 0.1,     // Low: no sequence specified
    "filter_specificity": 0.15     // Medium: "technology" industry filter
  },
  "reasoning": "Query emphasizes extensive experience and leadership progression in technology",
  "confidence": 0.9
}
```

**SQL Function Call:**
```sql
SELECT * FROM comprehensive_chronological_search_with_weights(
  -- Parsed filters
  min_total_experience_years := 10,
  career_industry_filter := 'technology',
  require_leadership_experience := true,
  
  -- LLM-assigned weights
  weight_career_quality := 0.65,
  weight_education_quality := 0.1,
  weight_timeline_precision := 0.1,
  weight_filter_specificity := 0.15,
  
  order_by := 'career_quality'
);
```

### Example 2: Timeline-Focused Query

**Natural Language Input:**
> "Show me alumni who worked at Chick-fil-A then went to graduate school"

**LLM Weight Assignment:**
```json
{
  "weights": {
    "career_quality": 0.2,         // Low: basic work experience
    "education_quality": 0.25,     // Medium: graduate school mentioned
    "timeline_precision": 0.45,    // High: specific sequence pattern
    "filter_specificity": 0.1      // Low: only one company specified
  },
  "reasoning": "Query focuses on specific career-to-education sequence pattern",
  "confidence": 0.95
}
```

**SQL Function Call:**
```sql
SELECT * FROM comprehensive_chronological_search_with_weights(
  -- Parsed filters
  timeline_context_filter := 'target_company',  -- Chick-fil-A experience
  education_degree_level_filter := 'Master',    -- Graduate school
  sequence_pattern := 'career_then_education',  -- Sequence requirement
  max_gap_months := 12,                         -- Reasonable gap
  
  -- LLM-assigned weights  
  weight_career_quality := 0.2,
  weight_education_quality := 0.25,
  weight_timeline_precision := 0.45,
  weight_filter_specificity := 0.1,
  
  order_by := 'timeline_precision'
);
```

### Example 3: Filter-Specific Query

**Natural Language Input:**
> "People who worked at both Google and Microsoft and have computer science degrees"

**LLM Weight Assignment:**
```json
{
  "weights": {
    "career_quality": 0.25,        // Medium: quality indicated by top companies
    "education_quality": 0.25,     // Medium: specific degree requirement
    "timeline_precision": 0.1,     // Low: no sequence specified
    "filter_specificity": 0.4      // High: multiple specific companies + degree
  },
  "reasoning": "Query requires specific company experience and degree matches",
  "confidence": 0.85
}
```

**SQL Function Call:**
```sql
-- Note: This requires multiple SQL calls or modification for "both companies"
-- Simplified version:
SELECT * FROM comprehensive_chronological_search_with_weights(
  -- Parsed filters (would need additional logic for "both" companies)
  career_company_filter := 'Google',  -- First company filter
  education_degree_name_filter := 'Computer Science',
  
  -- LLM-assigned weights
  weight_career_quality := 0.25,
  weight_education_quality := 0.25,
  weight_timeline_precision := 0.1,
  weight_filter_specificity := 0.4,
  
  order_by := 'filter_specificity'
);
```

### Example 4: Complex Progression Query

**Natural Language Input:**
> "Alumni who started entry-level, became managers, then got MBA degrees within 3 years"

**LLM Weight Assignment:**
```json
{
  "weights": {
    "career_quality": 0.4,         // High: progression focus
    "education_quality": 0.3,      // High: specific advanced degree
    "timeline_precision": 0.25,    // Medium: timing constraint
    "filter_specificity": 0.05     // Low: no specific companies/schools
  },
  "reasoning": "Query emphasizes career progression pattern followed by specific education",
  "confidence": 0.9
}
```

**SQL Function Call:**
```sql
SELECT * FROM comprehensive_chronological_search_with_weights(
  -- Parsed filters
  require_management_experience := true,
  education_degree_level_filter := 'MBA',
  sequence_pattern := 'career_then_education',
  max_gap_months := 36,  -- 3 years converted to months
  
  -- LLM-assigned weights
  weight_career_quality := 0.4,
  weight_education_quality := 0.3,
  weight_timeline_precision := 0.25,
  weight_filter_specificity := 0.05,
  
  order_by := 'relevance_score'
);
```

## Integration Architecture

```typescript
class ChronologicalSearchService {
  constructor(
    private llmWeightAssigner: LLMWeightAssigner,
    private metadataExtractor: MetadataExtractor,
    private databaseService: DatabaseService
  ) {}

  async searchChronological(naturalLanguageQuery: string): Promise<SearchResults> {
    // Step 1: Extract structured metadata
    const metadata = await this.metadataExtractor.extract(naturalLanguageQuery);
    
    // Step 2: Get LLM weight assignment
    const weightAssignment = await this.llmWeightAssigner.assignWeights(
      naturalLanguageQuery, 
      metadata
    );
    
    // Step 3: Convert to SQL parameters
    const sqlParams = {
      // Career filters
      career_company_filter: metadata.career_filters?.career_company_filter,
      career_industry_filter: metadata.career_filters?.career_industry_filter,
      min_total_experience_years: metadata.career_filters?.total_experience_years,
      require_management_experience: metadata.career_filters?.require_management,
      
      // Education filters
      education_institution_filter: metadata.education_filters?.education_institution_filter,
      education_degree_level_filter: metadata.education_filters?.education_degree_level_filter,
      
      // Temporal filters
      sequence_pattern: metadata.temporal_relationships?.sequence_pattern || 'any',
      max_gap_months: metadata.temporal_relationships?.max_gap_months || 24,
      
      // Dynamic weights from LLM
      weight_career_quality: weightAssignment.weights.career_quality,
      weight_education_quality: weightAssignment.weights.education_quality,
      weight_timeline_precision: weightAssignment.weights.timeline_precision,
      weight_filter_specificity: weightAssignment.weights.filter_specificity,
      
      // Result configuration
      limit_count: 20,
      order_by: 'relevance_score'
    };
    
    // Step 4: Execute SQL function
    const results = await this.databaseService.execute(
      'comprehensive_chronological_search_with_weights',
      sqlParams
    );
    
    // Step 5: Return enriched results
    return {
      results,
      query_analysis: {
        original_query: naturalLanguageQuery,
        extracted_metadata: metadata,
        weight_assignment: weightAssignment,
        sql_parameters: sqlParams
      }
    };
  }
}
```

## Key Benefits of This Approach

### 1. **Perfect Schema Alignment**
- Uses all your table constraints and indexes effectively
- Leverages timeline context flags for precise filtering
- Handles current positions (end_year = 9999) correctly

### 2. **Dynamic Intelligence**
- LLM understands query intent and assigns appropriate weights
- Same SQL function handles vastly different query types
- Explainable results with weight reasoning

### 3. **Performance Optimized**
- Uses your existing indexes effectively
- Dynamic SQL generation only when needed
- Efficient timeline calculations using month numbers

### 4. **Comprehensive Coverage**
- Handles experience, progression, education, and timeline queries
- Supports complex combinations and edge cases
- Transparent scoring for debugging

This integration gives you the **best of both worlds**: sophisticated LLM understanding of natural language queries combined with efficient SQL execution using your optimized schema. The four weight dimensions cleanly separate concerns while the LLM dynamically balances them based on user intent.

Ready to implement this approach? 