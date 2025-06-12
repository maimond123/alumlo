# LLM Query Parser Design for Chronological Search

## Overview
Transform natural language queries into structured metadata that can be fed into the `comprehensive_chronological_search_chick_fil_a` function.

## Core Architecture

### 1. Query Classification System
```typescript
interface QueryClassification {
  primary_intent: 'chronological' | 'temporal' | 'vector' | 'hybrid';
  confidence_score: number;
  reasoning: string;
}

interface ChronologicalQuery {
  classification: QueryClassification;
  extracted_metadata: ChronologicalMetadata;
  fallback_options: string[];
}
```

### 2. Metadata Extraction Schema
```typescript
interface ChronologicalMetadata {
  // CAREER FILTERS
  career_filters: {
    min_years_in_industry?: string; // "2+", "5+", "10+"
    min_years_at_level?: string;
    total_experience_years?: number;
    career_company_filter?: string;
    career_location_filter?: string;
    career_industry_filter?: string;
    career_job_level_filter?: string;
    target_company_tenure_min?: number; // months
    target_company_tenure_max?: number; // months
  };
  
  // EDUCATION FILTERS  
  education_filters: {
    education_institution_filter?: string;
    education_location_filter?: string;
    education_degree_level_filter?: string;
    education_degree_name_filter?: string;
  };
  
  // PROGRESSION PATTERNS
  progression_patterns: {
    career_progression_pattern?: 'management_track' | 'individual_contributor' | 'leadership_progression';
    industry_transition_pattern?: string[]; // ['Finance', 'Technology']
    level_progression_pattern?: string[]; // ['Entry Level', 'Mid Level', 'Senior']
    degree_progression_pattern?: string[]; // ['High School', 'Bachelor\'s Degree', 'Master\'s Degree']
    company_size_progression?: string[]; // ['Startup', 'Large']
  };
  
  // TEMPORAL RELATIONSHIPS
  temporal_relationships: {
    sequence_pattern?: 'education_then_career' | 'career_then_education' | 'concurrent' | 'any';
    max_gap_months?: number;
    min_gap_months?: number;
    concurrent_activities?: boolean;
    geographic_mobility?: boolean;
  };
  
  // TIMELINE CONTEXT
  timeline_context: {
    timeline_context_filter?: 'target_company' | 'pre_company' | 'during_company' | 'post_company' | 'unrelated';
    education_timeline_filter?: 'pre_company' | 'during_company' | 'post_company' | 'unrelated';
    include_unrelated_positions?: boolean;
    include_unrelated_education?: boolean;
  };
  
  // RESULT CONFIGURATION
  result_config: {
    limit_count?: number;
    order_by?: 'chronological_relevance' | 'career_progression' | 'education_progression' | 'total_experience';
  };
}
```

## LLM Prompt Engineering Strategy

### 1. System Prompt Template
```
You are a query parser for a chronological career search system. Your job is to extract structured metadata from natural language queries about career progression and education timelines.

CONTEXT: You're analyzing alumni from Chick-fil-A to understand their career and education journeys.

CAPABILITIES: You can search for:
- Career progression patterns (promotions, industry changes, job level advancement)
- Education-to-career sequences (school then work, work then school, concurrent)
- Geographic mobility and company size transitions
- Specific tenure requirements and experience levels
- Timeline relationships between education and career events

IMPORTANT RULES:
1. Only extract metadata that is explicitly mentioned or strongly implied
2. Use null/undefined for parameters not mentioned in the query
3. Be conservative with assumptions - better to under-specify than over-specify
4. Pay attention to temporal keywords: "then", "after", "before", "while", "during"
5. Distinguish between requirements (must have) vs preferences (nice to have)

OUTPUT FORMAT: Return a JSON object matching the ChronologicalMetadata interface.
```

### 2. Few-Shot Examples for Training

#### Example 1: Sequential Pattern
```
Query: "Find people who worked at Chick-fil-A then went to college"

Expected Output:
{
  "career_filters": {
    "career_company_filter": "Chick-fil-A"
  },
  "education_filters": {},
  "temporal_relationships": {
    "sequence_pattern": "career_then_education",
    "max_gap_months": 24
  },
  "timeline_context": {
    "include_unrelated_positions": false,
    "include_unrelated_education": false
  },
  "result_config": {
    "limit_count": 20,
    "order_by": "chronological_relevance"
  }
}
```

#### Example 2: Experience + Location
```
Query: "Show me people with 5+ years experience who moved cities for their career"

Expected Output:
{
  "career_filters": {
    "total_experience_years": 5
  },
  "temporal_relationships": {
    "geographic_mobility": true
  },
  "result_config": {
    "limit_count": 20,
    "order_by": "total_experience"
  }
}
```

#### Example 3: Concurrent Activities
```
Query: "Find alumni who worked while going to school"

Expected Output:
{
  "temporal_relationships": {
    "sequence_pattern": "concurrent",
    "concurrent_activities": true
  },
  "timeline_context": {
    "include_unrelated_positions": true,
    "include_unrelated_education": true
  },
  "result_config": {
    "limit_count": 20,
    "order_by": "chronological_relevance"
  }
}
```

#### Example 4: Complex Progression
```
Query: "People who started entry-level, got promoted to management, then got MBA degrees"

Expected Output:
{
  "career_filters": {
    "career_job_level_filter": "Manager"
  },
  "education_filters": {
    "education_degree_name_filter": "MBA"
  },
  "progression_patterns": {
    "career_progression_pattern": "management_track",
    "level_progression_pattern": ["Entry Level", "Manager"]
  },
  "temporal_relationships": {
    "sequence_pattern": "career_then_education"
  },
  "timeline_context": {
    "education_timeline_filter": "post_company"
  },
  "result_config": {
    "order_by": "career_progression"
  }
}
```

## Implementation Strategy

### 1. Multi-Stage Processing Pipeline

```typescript
class ChronologicalQueryParser {
  async parseQuery(naturalLanguageQuery: string): Promise<ChronologicalQuery> {
    // Stage 1: Intent Classification
    const classification = await this.classifyIntent(naturalLanguageQuery);
    
    if (classification.primary_intent !== 'chronological') {
      return this.createFallbackResponse(classification);
    }
    
    // Stage 2: Metadata Extraction
    const metadata = await this.extractMetadata(naturalLanguageQuery);
    
    // Stage 3: Validation & Enhancement
    const validatedMetadata = await this.validateAndEnhance(metadata, naturalLanguageQuery);
    
    // Stage 4: Generate SQL Parameters
    const sqlParams = this.convertToSQLParams(validatedMetadata);
    
    return {
      classification,
      extracted_metadata: validatedMetadata,
      sql_parameters: sqlParams,
      fallback_options: this.generateFallbacks(naturalLanguageQuery)
    };
  }
}
```

### 2. Key Parsing Patterns to Detect

#### Temporal Sequence Indicators
```typescript
const SEQUENCE_PATTERNS = {
  education_then_career: [
    "graduated then worked",
    "finished school and got a job",
    "after college started working",
    "degree then career"
  ],
  career_then_education: [
    "worked then went to school",
    "after working went back to school", 
    "job then college",
    "career then education"
  ],
  concurrent: [
    "worked while studying",
    "job during school",
    "working student",
    "part-time while in college"
  ]
};
```

#### Experience Level Indicators
```typescript
const EXPERIENCE_PATTERNS = {
  "1+": ["1+ years", "at least 1 year", "minimum 1 year"],
  "2+": ["2+ years", "at least 2 years", "minimum 2 years"],
  "5+": ["5+ years", "at least 5 years", "experienced", "senior level"],
  "10+": ["10+ years", "decade of experience", "very experienced"]
};
```

#### Career Progression Indicators
```typescript
const PROGRESSION_PATTERNS = {
  management_track: [
    "promoted to manager",
    "leadership role",
    "management position",
    "became a supervisor"
  ],
  individual_contributor: [
    "senior engineer",
    "specialist role",
    "expert level",
    "technical track"
  ]
};
```

### 3. Validation & Enhancement Logic

```typescript
class MetadataValidator {
  validateAndEnhance(metadata: ChronologicalMetadata, originalQuery: string): ChronologicalMetadata {
    // 1. Consistency Checks
    this.checkTemporalConsistency(metadata);
    
    // 2. Default Value Assignment
    this.assignDefaults(metadata);
    
    // 3. Conflict Resolution
    this.resolveConflicts(metadata, originalQuery);
    
    // 4. Enhancement with Domain Knowledge
    this.enhanceWithDomainKnowledge(metadata);
    
    return metadata;
  }
  
  private checkTemporalConsistency(metadata: ChronologicalMetadata): void {
    // Example: If sequence_pattern is 'concurrent', set concurrent_activities to true
    if (metadata.temporal_relationships?.sequence_pattern === 'concurrent') {
      metadata.temporal_relationships.concurrent_activities = true;
    }
    
    // Example: If looking for post-company education, set appropriate timeline filter
    if (metadata.education_filters?.education_degree_level_filter && 
        metadata.career_filters?.career_company_filter) {
      metadata.timeline_context = metadata.timeline_context || {};
      metadata.timeline_context.education_timeline_filter = 'post_company';
    }
  }
}
```

### 4. Error Handling & Fallbacks

```typescript
interface ParseError {
  type: 'ambiguous_query' | 'insufficient_metadata' | 'conflicting_requirements';
  message: string;
  suggestions: string[];
}

class QueryParserErrorHandler {
  handleParseError(error: ParseError, originalQuery: string): ChronologicalQuery {
    return {
      classification: {
        primary_intent: 'chronological',
        confidence_score: 0.3,
        reasoning: `Parse error: ${error.message}`
      },
      extracted_metadata: this.createMinimalMetadata(),
      fallback_options: [
        "Try a more specific query with clear timeline indicators",
        "Specify whether you want education before or after career",
        "Include specific companies, schools, or job titles",
        ...error.suggestions
      ]
    };
  }
}
```

## Testing Strategy

### 1. Query Categories for Testing
- **Simple Filters**: "People who worked at Google"
- **Temporal Sequences**: "Worked then went to school"  
- **Complex Progressions**: "Entry level to management to MBA"
- **Geographic Patterns**: "Moved cities for career"
- **Concurrent Activities**: "Worked while studying"
- **Ambiguous Queries**: "Find successful people"

### 2. Validation Metrics
- **Extraction Accuracy**: % of correctly identified metadata fields
- **Temporal Logic Accuracy**: % of correctly identified sequence patterns
- **SQL Parameter Correctness**: % of queries that produce valid SQL
- **Result Relevance**: % of results that match user intent

Would you like me to dive deeper into any specific aspect of this design, or shall we start implementing the LLM prompt engineering and testing framework? 