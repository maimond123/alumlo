# LLM-Driven Weight Assignment for Chronological Search

## Improved Weight Categories

### Eliminating Experience/Career Overlap
Instead of separating `experience_total` and `career_progression`, combine into coherent dimensions:

```typescript
interface ChronologicalWeights {
  career_quality: number;      // Combines experience + progression + leadership
  education_quality: number;   // Degree advancement + institution quality
  timeline_precision: number;  // How well sequence/timing matches
  filter_specificity: number;  // Exact matches to specified criteria
}
```

## LLM Weight Assignment Prompt

```typescript
const WEIGHT_ASSIGNMENT_PROMPT = `
You are analyzing a chronological career search query to determine what the user cares most about.

QUERY: "${naturalLanguageQuery}"

Assign weights (0-1, must sum to 1.0) across these dimensions:

1. CAREER_QUALITY (combines experience + progression + leadership)
   - Total years of experience
   - Job level advancement (entry → mid → senior → management)
   - Leadership roles and responsibilities
   - Industry expertise and specialization

2. EDUCATION_QUALITY (degree advancement + institution prestige)
   - Degree level progression (high school → bachelor's → master's → PhD)
   - Institution reputation and selectivity
   - Field of study relevance
   - Academic achievements

3. TIMELINE_PRECISION (sequence patterns + temporal accuracy)
   - How closely their timeline matches requested pattern
   - Gap timing between career and education transitions
   - Concurrent activities (working while studying)
   - Geographic mobility for opportunities

4. FILTER_SPECIFICITY (exact matches to user criteria)
   - Specific companies mentioned in query
   - Specific schools/institutions mentioned
   - Specific job titles or industries
   - Location requirements

WEIGHT ASSIGNMENT EXAMPLES:

Query: "Find people with 10+ years experience"
Response: {"career_quality": 0.7, "education_quality": 0.1, "timeline_precision": 0.1, "filter_specificity": 0.1}

Query: "People who worked at Google then went to Stanford"  
Response: {"career_quality": 0.2, "education_quality": 0.2, "timeline_precision": 0.3, "filter_specificity": 0.3}

Query: "Alumni who worked while studying"
Response: {"career_quality": 0.2, "education_quality": 0.2, "timeline_precision": 0.6, "filter_specificity": 0.0}

Query: "Management track people who got MBA degrees"
Response: {"career_quality": 0.4, "education_quality": 0.3, "timeline_precision": 0.2, "filter_specificity": 0.1}

Query: "Experienced technology leaders"
Response: {"career_quality": 0.6, "education_quality": 0.1, "timeline_precision": 0.1, "filter_specificity": 0.2}

Query: "People who worked at Apple and Microsoft"
Response: {"career_quality": 0.25, "education_quality": 0.15, "timeline_precision": 0.1, "filter_specificity": 0.5}

Return ONLY the JSON object with the four weights. The weights must sum to 1.0.
`;
```

## Implementation with Validation

```typescript
interface WeightAssignment {
  career_quality: number;
  education_quality: number;
  timeline_precision: number;
  filter_specificity: number;
}

class LLMWeightAssigner {
  async assignWeights(query: string): Promise<WeightAssignment> {
    const prompt = this.buildWeightPrompt(query);
    const response = await this.callLLM(prompt);
    
    // Validate and normalize weights
    const validated = this.validateWeights(response);
    
    return validated;
  }
  
  private validateWeights(response: any): WeightAssignment {
    let weights = response;
    
    // If response is wrapped in a weights object, extract it
    if (response.weights) {
      weights = response.weights;
    }
    
    // Ensure weights sum to 1.0
    const sum = Object.values(weights).reduce((a: number, b: number) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      // Normalize if close to 1.0
      Object.keys(weights).forEach(key => {
        weights[key] = (weights[key] as number) / sum;
      });
    }
    
    // Ensure no negative weights
    Object.keys(weights).forEach(key => {
      weights[key] = Math.max(0, weights[key] as number);
    });
    
    // Add fallback weights if LLM failed
    if (sum < 0.1) {
      return this.getDefaultWeights();
    }
    
    return {
      career_quality: weights.career_quality || 0.4,
      education_quality: weights.education_quality || 0.25,
      timeline_precision: weights.timeline_precision || 0.25,
      filter_specificity: weights.filter_specificity || 0.1
    };
  }
  
  private getDefaultWeights(): WeightAssignment {
    return {
      career_quality: 0.4,
      education_quality: 0.25,
      timeline_precision: 0.25,
      filter_specificity: 0.1
    };
  }
}
```

## Query-Specific Weight Examples

### Experience-Focused Queries
```
Query: "Find people with 15+ years experience in technology"

LLM Output:
{
  "career_quality": 0.6,      // Primary focus on experience depth
  "education_quality": 0.1,   // Less important for experience queries
  "timeline_precision": 0.1,  // No specific sequence required
  "filter_specificity": 0.2   // "technology" industry filter
}
```

### Timeline-Focused Queries
```
Query: "People who worked part-time while getting their master's degree"

LLM Output:
{
  "career_quality": 0.2,      // Some work experience required
  "education_quality": 0.2,   // Master's degree requirement
  "timeline_precision": 0.6,  // Concurrent pattern is key
  "filter_specificity": 0.0   // No specific companies/schools
}
```

### Progression-Focused Queries
```
Query: "Alumni who started entry-level and became managers within 5 years"

LLM Output:
{
  "career_quality": 0.7,      // Rapid progression is key
  "education_quality": 0.1,   // Education less critical
  "timeline_precision": 0.2,  // Timing constraint important
  "filter_specificity": 0.0   // No specific company requirements
}
```

### Filter-Specific Queries
```
Query: "People who worked at both Apple and Google"

LLM Output:
{
  "career_quality": 0.2,      // Quality less important than specific experience
  "education_quality": 0.1,   // Education not mentioned
  "timeline_precision": 0.2,  // Some sequence implied
  "filter_specificity": 0.5   // Two specific companies required
}
```

## Enhanced SQL Function with Dynamic Weights

```sql
CREATE OR REPLACE FUNCTION chronological_search_with_weights(
  -- ... existing parameters ...
  
  -- Dynamic weight parameters (passed from LLM)
  weight_career_quality float DEFAULT 0.4,
  weight_education_quality float DEFAULT 0.25,
  weight_timeline_precision float DEFAULT 0.25,
  weight_filter_specificity float DEFAULT 0.1
)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  WITH scoring AS (
    SELECT 
      profile_id,
      -- Calculate component scores
      calculate_career_quality_score(...) as career_score,
      calculate_education_quality_score(...) as education_score,
      calculate_timeline_precision_score(...) as timeline_score,
      calculate_filter_specificity_score(...) as filter_score
    FROM ...
  )
  SELECT 
    *,
    -- Dynamic weighted final score
    (career_score * weight_career_quality +
     education_score * weight_education_quality +
     timeline_score * weight_timeline_precision +
     filter_score * weight_filter_specificity) as final_relevance_score
  FROM scoring
  ORDER BY final_relevance_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

## Benefits of LLM Weight Assignment

1. **Context Awareness**: Understands nuanced queries like "experienced startup founders who got MBAs"

2. **Simplified Response**: Clean JSON with just the weights needed for SQL execution

3. **Adaptive**: Handles new query types without code changes

4. **Consistent**: Same query intent gets same weights across different phrasings

5. **Debuggable**: Can trace ranking back to weight decisions

## Potential Issues & Mitigations

### Issue: LLM Inconsistency
```
Mitigation: 
- Cache weight decisions for similar queries
- Use temperature=0 for consistent outputs
- Validate weights before using
```

### Issue: Edge Cases
```
Mitigation:
- Comprehensive examples in prompt
- Fallback to default weights if LLM fails
- Weight normalization and validation
```

### Issue: Performance
```
Mitigation:
- Cache weight assignments
- Pre-compute weights for common query patterns
- Use faster LLM for weight assignment vs. full parsing
```

This simplified approach provides clean weight assignments without extra reasoning or confidence data, making it easier to integrate with the SQL function. 