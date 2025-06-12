# Chronological Relevance Scoring - Deep Dive

## Current Scoring Formula (From the SQL Function)

```sql
chronological_relevance_score = (
  -- Career progression weight (40%)
  COALESCE(ca.career_progression_score, 0) * 0.4 +
  -- Education progression weight (30%)
  COALESCE(ea.education_progression_score, 0) * 0.3 +
  -- Sequence pattern match weight (20%)
  [sequence_pattern_score] * 0.2 +
  -- Total experience weight (10%)
  LEAST(COALESCE(ca.total_years_experience, 0) / 20.0, 1.0) * 0.1
)
```

## Detailed Scoring Examples

### Example 1: Sarah - Management Track Graduate
**Career Timeline:**
- 2018-2020: Chick-fil-A Team Member (Entry Level)
- 2020-2021: Chick-fil-A Shift Leader (Mid Level) 
- 2021-2023: Google Senior Engineer (Senior Level)

**Education Timeline:**
- 2016-2020: High School
- 2021-2025: Georgia Tech - Computer Science (Bachelor's)

**Scoring Breakdown:**

#### Career Progression Score (Max: 1.0)
```
Base calculation:
- Distinct job levels: 3 (Entry → Mid → Senior) = (3-1) * 0.25 = 0.5
- Has "Senior" role: +0.3
- Has leadership role (Shift Leader): +0.2
- Total: 0.5 + 0.3 + 0.2 = 1.0
```

#### Education Progression Score (Max: 1.0)
```
- 2 distinct levels (High School → Bachelor's) = 0.7
```

#### Sequence Pattern Score (Max: 1.0)
```
Query: "Find people who worked then went to school"
- Pattern: career_then_education
- Sarah's timeline: Career ended 2023, Education started 2021
- Timeline doesn't match (education started during career)
- Score: 0.0
```

#### Experience Score (Max: 1.0)
```
- Total experience: 5 years
- Normalized: min(5/20, 1.0) = 0.25
```

#### Final Score
```
chronological_relevance_score = 1.0*0.4 + 0.7*0.3 + 0.0*0.2 + 0.25*0.1
                              = 0.4 + 0.21 + 0.0 + 0.025
                              = 0.635
```

### Example 2: Mike - Perfect Sequential Pattern
**Career Timeline:**
- 2018-2020: Chick-fil-A Team Member (Entry Level)
- 2020-2022: Chick-fil-A Assistant Manager (Mid Level)

**Education Timeline:**
- 2016-2018: High School
- 2022-2026: University of Georgia - Business (Bachelor's)

**Scoring Breakdown:**

#### Career Progression Score
```
- Distinct job levels: 2 (Entry → Mid) = (2-1) * 0.25 = 0.25
- Has management role: +0.4
- Has leadership role: +0.2
- Total: 0.25 + 0.4 + 0.2 = 0.85
```

#### Education Progression Score
```
- 2 distinct levels (High School → Bachelor's) = 0.7
```

#### Sequence Pattern Score
```
Query: "Find people who worked then went to school"
- Pattern: career_then_education
- Mike's timeline: Career ended 2022, Education started 2022
- Perfect match!
- Score: 1.0
```

#### Experience Score
```
- Total experience: 4 years
- Normalized: min(4/20, 1.0) = 0.2
```

#### Final Score
```
chronological_relevance_score = 0.85*0.4 + 0.7*0.3 + 1.0*0.2 + 0.2*0.1
                              = 0.34 + 0.21 + 0.2 + 0.02
                              = 0.77
```

### Example 3: Jessica - Concurrent Activities
**Career Timeline:**
- 2019-2021: Chick-fil-A Team Member (Entry Level, part-time)
- 2021-2023: Local Restaurant Server (Entry Level)

**Education Timeline:**
- 2018-2022: Florida State University - Marketing (Bachelor's)

**Scoring Breakdown:**

#### Career Progression Score
```
- Distinct job levels: 1 (Entry Level only) = 0.1 (minimum)
- No senior roles, no management, no leadership
- Total: 0.1
```

#### Education Progression Score
```
- 2 distinct levels (assumed High School → Bachelor's) = 0.7
```

#### Sequence Pattern Score
```
Query: "Find people who worked while going to school"
- Pattern: concurrent
- Jessica's timeline: Work (2019-2021) overlaps with Education (2018-2022)
- Perfect match!
- Score: 1.0
```

#### Experience Score
```
- Total experience: 4 years
- Normalized: min(4/20, 1.0) = 0.2
```

#### Final Score
```
chronological_relevance_score = 0.1*0.4 + 0.7*0.3 + 1.0*0.2 + 0.2*0.1
                              = 0.04 + 0.21 + 0.2 + 0.02
                              = 0.47
```

## Problems with Current Scoring

### 1. **Static Weights Don't Reflect Query Intent**
```
Query: "Find people with 10+ years experience"
- Experience should be weighted much higher than 10%
- Career progression less important than total experience

Query: "Find people who worked while studying"
- Sequence pattern should be weighted much higher than 20%
- Career progression less relevant
```

### 2. **Career Progression Scoring Too Simple**
```
Current logic:
- Count distinct job levels
- Bonus for senior/management keywords

Problems:
- Doesn't account for industry context
- Promotion within same level not recognized
- No consideration of company prestige
- Lateral moves treated as no progression
```

### 3. **No Context-Aware Adjustments**
```
Current: Fixed 40/30/20/10 weights for all queries

Should be dynamic based on:
- Query type and intent
- Available data quality
- User's specific interests
```

## Smarter Scoring Approaches

### 1. **Dynamic Weight Assignment Based on Query**

```typescript
interface QueryBasedWeights {
  career_progression: number;
  education_progression: number;
  sequence_pattern: number;
  experience_total: number;
  temporal_precision: number;
  filter_specificity: number;
}

function calculateQueryWeights(query: ChronologicalMetadata): QueryBasedWeights {
  // High experience requirement = weight experience heavily
  if (query.career_filters?.total_experience_years >= 10) {
    return {
      career_progression: 0.2,
      education_progression: 0.15,
      sequence_pattern: 0.15,
      experience_total: 0.5,  // 50% for experience-focused queries
      temporal_precision: 0.0,
      filter_specificity: 0.0
    };
  }
  
  // Sequence pattern queries = weight temporal relationships
  if (query.temporal_relationships?.sequence_pattern !== 'any') {
    return {
      career_progression: 0.25,
      education_progression: 0.25,
      sequence_pattern: 0.4,   // 40% for sequence-focused queries
      experience_total: 0.1,
      temporal_precision: 0.0,
      filter_specificity: 0.0
    };
  }
  
  // Complex progression queries = weight career progression
  if (query.progression_patterns?.career_progression_pattern) {
    return {
      career_progression: 0.5,  // 50% for progression-focused queries
      education_progression: 0.2,
      sequence_pattern: 0.2,
      experience_total: 0.1,
      temporal_precision: 0.0,
      filter_specificity: 0.0
    };
  }
  
  // Default balanced weights
  return {
    career_progression: 0.4,
    education_progression: 0.3,
    sequence_pattern: 0.2,
    experience_total: 0.1,
    temporal_precision: 0.0,
    filter_specificity: 0.0
  };
}
```

### 2. **Multi-Dimensional Career Progression Scoring**

Instead of the simple current approach, calculate multiple progression dimensions:

```typescript
interface CareerProgressionMetrics {
  level_advancement: number;      // Entry → Mid → Senior progression
  responsibility_growth: number;  // Individual → Team Lead → Manager
  industry_mobility: number;      // Cross-industry experience
  company_prestige: number;       // Startup → Fortune 500 progression
  skill_specialization: number;   // Depth in specific areas
  leadership_development: number; // People management experience
}

function calculateCareerProgression(careerEvents: CareerEvent[]): CareerProgressionMetrics {
  return {
    level_advancement: calculateLevelProgression(careerEvents),
    responsibility_growth: calculateResponsibilityGrowth(careerEvents),
    industry_mobility: calculateIndustryMobility(careerEvents),
    company_prestige: calculateCompanyProgression(careerEvents),
    skill_specialization: calculateSpecialization(careerEvents),
    leadership_development: calculateLeadershipGrowth(careerEvents)
  };
}
```

### 3. **Temporal Precision Scoring**

Reward profiles that match the temporal requirements more precisely:

```typescript
function calculateTemporalPrecision(
  profileTimeline: Timeline,
  queryPattern: TemporalRequirements
): number {
  let precisionScore = 0;
  
  // Gap precision (smaller gaps = higher score for sequence patterns)
  if (queryPattern.sequence_pattern !== 'any') {
    const actualGap = calculateSequenceGap(profileTimeline);
    const maxAcceptableGap = queryPattern.max_gap_months || 24;
    
    // Score decreases as gap approaches maximum
    precisionScore += (1 - actualGap / maxAcceptableGap) * 0.4;
  }
  
  // Timeline alignment (exact matches get bonus)
  if (queryPattern.sequence_pattern === 'concurrent') {
    const overlapDuration = calculateOverlapDuration(profileTimeline);
    const totalDuration = calculateTotalDuration(profileTimeline);
    
    // Higher overlap percentage = higher score
    precisionScore += (overlapDuration / totalDuration) * 0.6;
  }
  
  return Math.min(precisionScore, 1.0);
}
```

### 4. **Filter Specificity Bonus**

Reward profiles that match specific filters more precisely:

```typescript
function calculateFilterSpecificity(
  profile: Profile,
  queryFilters: ChronologicalMetadata
): number {
  let specificityScore = 0;
  let filterCount = 0;
  
  // Company exact matches
  if (queryFilters.career_filters?.career_company_filter) {
    filterCount++;
    if (hasExactCompanyMatch(profile, queryFilters.career_filters.career_company_filter)) {
      specificityScore += 0.2;
    }
  }
  
  // Education institution exact matches
  if (queryFilters.education_filters?.education_institution_filter) {
    filterCount++;
    if (hasExactInstitutionMatch(profile, queryFilters.education_filters.education_institution_filter)) {
      specificityScore += 0.2;
    }
  }
  
  // Location progression matches
  if (queryFilters.temporal_relationships?.geographic_mobility) {
    filterCount++;
    if (hasGeographicMobility(profile)) {
      specificityScore += 0.15;
    }
  }
  
  // Industry progression matches
  if (queryFilters.progression_patterns?.industry_transition_pattern) {
    filterCount++;
    if (hasIndustryProgression(profile, queryFilters.progression_patterns.industry_transition_pattern)) {
      specificityScore += 0.25;
    }
  }
  
  return filterCount > 0 ? specificityScore / filterCount : 0;
}
```

### 5. **Composite Scoring with Query Context**

```sql
-- Enhanced scoring function
CREATE OR REPLACE FUNCTION calculate_enhanced_relevance_score(
  career_metrics jsonb,
  education_metrics jsonb,
  temporal_metrics jsonb,
  query_weights jsonb,
  profile_specificity jsonb
) RETURNS float AS $$
DECLARE
  base_score float := 0;
  bonus_multiplier float := 1.0;
BEGIN
  -- Base weighted score
  base_score := 
    (career_metrics->>'level_advancement')::float * (query_weights->>'career_progression')::float +
    (education_metrics->>'progression_score')::float * (query_weights->>'education_progression')::float +
    (temporal_metrics->>'sequence_match')::float * (query_weights->>'sequence_pattern')::float +
    (career_metrics->>'total_experience_normalized')::float * (query_weights->>'experience_total')::float +
    (temporal_metrics->>'precision_score')::float * (query_weights->>'temporal_precision')::float +
    (profile_specificity->>'filter_match_score')::float * (query_weights->>'filter_specificity')::float;
  
  -- Apply bonus multipliers for exceptional matches
  IF (temporal_metrics->>'perfect_sequence_match')::boolean THEN
    bonus_multiplier := bonus_multiplier * 1.1;
  END IF;
  
  IF (profile_specificity->>'exact_filter_matches')::int >= 3 THEN
    bonus_multiplier := bonus_multiplier * 1.05;
  END IF;
  
  RETURN LEAST(base_score * bonus_multiplier, 1.0);
END;
$$ LANGUAGE plpgsql;
```

## Comparison: Current vs Enhanced Scoring

### Example Query: "Find people with 5+ years experience who worked then went to school"

#### Current Scoring (Mike's Profile):
```
Score: 0.77
Breakdown: Career(0.34) + Education(0.21) + Sequence(0.2) + Experience(0.02) = 0.77
```

#### Enhanced Scoring (Mike's Profile):
```
Query-based weights:
- experience_total: 0.35 (higher due to 5+ requirement)
- sequence_pattern: 0.35 (higher due to specific sequence)
- career_progression: 0.2
- education_progression: 0.1

Enhanced metrics:
- Multi-dimensional career: 0.75 (level + responsibility + leadership)
- Temporal precision: 0.95 (perfect gap timing)
- Filter specificity: 0.8 (exact experience + sequence match)

Score: 0.75*0.2 + 0.7*0.1 + 0.95*0.35 + 0.2*0.35 + 0.8*bonus = 0.865
```

**Result**: Enhanced scoring better reflects the query intent and rewards precise matches.

## Implementation Priority

1. **Start with dynamic weight assignment** - biggest impact, easiest to implement
2. **Add temporal precision scoring** - improves sequence pattern matching
3. **Enhance career progression metrics** - better career analysis
4. **Add filter specificity bonuses** - rewards exact matches

Would you like me to implement any of these enhanced scoring approaches, or dive deeper into a specific aspect? 