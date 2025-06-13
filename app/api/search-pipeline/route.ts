import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface SearchPipelineRequest {
  query: string;
  organizationName: string;
  isDemo?: boolean;
}

interface QueryClassification {
  type: 'chronological' | 'temporal' | 'standard';
}

interface ChronologicalFilters {
  min_years_in_industry?: number;
  min_years_in_function?: number;
  min_years_at_company_type?: number;
  career_progression_pattern?: string;
  degree_level_progression?: string[];
  education_industry_alignment?: boolean;
  gap_tolerance?: number;
  concurrent_activities?: boolean;
  industry_transitions?: string[];
  company_size_progression?: string[];
  geographic_mobility?: boolean;
}

interface TemporalElements {
  // Year-based filters
  specific_years?: number[];
  year_ranges?: Array<{start: number, end: number}>;
  exit_year?: number;
  exit_year_range?: [number, number];
  
  // Function/role filters
  target_company_functions?: string[];
  subsequent_functions?: string[];
  
  // Sequence patterns
  sequence_type?: "exit_then_function" | "function_then_function" | "concurrent" | "gap_then_function";
  timing_constraints?: {
    max_gap_months?: number;
    min_gap_months?: number;
  };
  
  // Education timing
  education_timing?: {
    school?: string;
    degree?: string;
    year?: number;
    concurrent_with_company?: boolean;
  };
}

interface WeightAssignment {
  career_quality: number;
  education_quality: number;
  timeline_precision: number;
  filter_specificity: number;
}

interface TemporalConfig {
  type: 'temporal';
  temporalElements: TemporalElements;
  searchMethod: string;
  sqlFunction: string;
  sqlParameters: any;
}

interface ChronologicalConfig {
  type: 'chronological';
  filters: ChronologicalFilters;
  weights: WeightAssignment;
  sqlFunction: string;
  sqlParameters: {
    chronological_filters: ChronologicalFilters;
    weight_assignment: WeightAssignment;
  };
}

interface StandardConfig {
  type: 'standard';
  enhancedFilters: any;
  searchMethod: 'semantic_with_filters';
}

type SearchConfig = TemporalConfig | ChronologicalConfig | StandardConfig;

interface SearchPipelineResponse {
  searchType: 'temporal' | 'chronological' | 'standard';
  classification: QueryClassification;
  searchConfig: SearchConfig;
  shouldExecuteSearch: boolean;
  fallbackToStandard?: boolean;
  metadata: {
    processingSteps: string[];
    llmCalls: number;
    processingTimeMs: number;
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const processingSteps: string[] = [];
  let llmCalls = 0;

  try {
    const { query, organizationName, isDemo = false }: SearchPipelineRequest = await req.json();
    
    console.log('🔍 [SEARCH PIPELINE] Starting unified LLM chain for:', query);
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // STEP 1: Universal Classification
    console.log('🔍 [STEP 1] Classifying search query...');
    const classification = await classifyQueryUsingMainAPI(query);
    processingSteps.push('classification');
    llmCalls++;
    
    // STEP 2: Route to Appropriate Translation
    let searchConfig: SearchConfig;
    
    switch (classification.type) {
      case 'temporal':
        console.log('🕐 [STEP 2] Processing temporal search...');
        searchConfig = await processTemporalSearch(query, classification, organizationName);
        processingSteps.push('temporal_extraction');
        llmCalls++;
        break;
        
      case 'chronological':
        console.log('📈 [STEP 2] Processing chronological search...');
        searchConfig = await processChronologicalSearch(query, classification, organizationName);
        processingSteps.push('chronological_translation', 'weight_assignment');
        llmCalls += 2;
        break;
        
      case 'standard':
        console.log('📊 [STEP 2] Processing standard search...');
        searchConfig = await processStandardSearch(query, classification);
        processingSteps.push('standard_enhancement');
        llmCalls++;
        break;
    }

    // STEP 3: Return Unified Response
    const response: SearchPipelineResponse = {
      searchType: classification.type,
      classification,
      searchConfig,
      shouldExecuteSearch: true,
      metadata: {
        processingSteps,
        llmCalls,
        processingTimeMs: Date.now() - startTime
      }
    };

    console.log('🔍 [PIPELINE COMPLETE] Search configuration ready:', {
      searchType: response.searchType,
      processingSteps: response.metadata.processingSteps,
      llmCalls: response.metadata.llmCalls,
      processingTime: response.metadata.processingTimeMs + 'ms'
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('🔍 [PIPELINE ERROR] Search pipeline failed:', error);
    
    // Unified error handling with fallback
    const errorResponse: SearchPipelineResponse = {
      searchType: 'standard',
      classification: { type: 'standard' },
      searchConfig: {
        type: 'standard',
        enhancedFilters: {},
        searchMethod: 'semantic_with_filters'
      },
      shouldExecuteSearch: true,
      fallbackToStandard: true,
      metadata: {
        processingSteps: [...processingSteps, 'error_fallback'],
        llmCalls,
        processingTimeMs: Date.now() - startTime
      }
    };
    
    return NextResponse.json(errorResponse, { status: 200 }); // Return 200 to allow fallback
  }
}

// NEW: Process temporal search
async function processTemporalSearch(
  query: string, 
  classification: QueryClassification,
  organizationName: string
): Promise<TemporalConfig> {
  const temporalElements = await extractTemporalElements(query);
  
  // Determine which temporal search method to use
  let searchMethod = 'general_filter';
  let sqlFunction = `temporal_filter_search_${organizationName}`;
  
  if (temporalElements.exit_year && temporalElements.subsequent_functions && temporalElements.subsequent_functions.length > 0) {
    searchMethod = 'specific_sequence';
    sqlFunction = `temporal_career_search_${organizationName}`;
  }
  
  return {
    type: 'temporal',
    temporalElements,
    searchMethod,
    sqlFunction,
    sqlParameters: mapTemporalParameters(temporalElements)
  };
}

// NEW: Extract temporal elements from query
async function extractTemporalElements(query: string): Promise<TemporalElements> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `Extract temporal elements from this alumni search query.

**TEMPORAL PATTERNS TO DETECT:**

1. **Specific Years**: "2019", "2020", "2018-2020"
2. **Exit Timing**: "left in", "departed", "graduated in", "exited"
3. **Sequences**: "then became", "after leaving", "later joined", "subsequently"
4. **Functions**: "consultants", "startup founders", "engineers", "analysts"
5. **Timing Constraints**: "within 6 months", "immediately after", "took a break", "gap year"
6. **Education Timing**: "while studying", "after graduation", "during MBA"

**EXAMPLES:**

Query: "People who left in 2019"
{
  "exit_year": 2019
}

Query: "Left in 2019 and became consultants"
{
  "exit_year": 2019,
  "subsequent_functions": ["consulting"],
  "sequence_type": "exit_then_function"
}

Query: "Worked here 2018-2020 then joined startups"
{
  "year_ranges": [{"start": 2018, "end": 2020}],
  "subsequent_functions": ["startup"],
  "sequence_type": "exit_then_function"
}

Query: "After graduation in 2021, became consultants within 6 months"
{
  "education_timing": {"year": 2021},
  "subsequent_functions": ["consulting"],
  "timing_constraints": {"max_gap_months": 6},
  "sequence_type": "function_then_function"
}

**OUTPUT FORMAT:**
Return only JSON with extracted temporal elements. If no temporal patterns detected, return empty object {}.`
      },
      {
        role: 'user',
        content: query
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return {};
  }

  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}

// NEW: Map temporal elements to SQL parameters
function mapTemporalParameters(temporalElements: TemporalElements): any {
  const params: any = {};
  
  // Map exit year
  if (temporalElements.exit_year) {
    params.p_target_company_year = temporalElements.exit_year;
    params.p_subsequent_year = temporalElements.exit_year + 1; // Default to next year
  }
  
  // Map subsequent functions
  if (temporalElements.subsequent_functions && temporalElements.subsequent_functions.length > 0) {
    params.p_subsequent_function = temporalElements.subsequent_functions[0];
    params.p_functions_filter = temporalElements.subsequent_functions;
  }
  
  // Map year ranges
  if (temporalElements.year_ranges && temporalElements.year_ranges.length > 0) {
    const range = temporalElements.year_ranges[0];
    params.p_exit_year_min = range.start;
    params.p_exit_year_max = range.end;
  }
  
  // Map specific years to company years filter
  if (temporalElements.specific_years && temporalElements.specific_years.length > 0) {
    params.p_company_years_filter = temporalElements.specific_years;
  }
  
  // Map education timing
  if (temporalElements.education_timing) {
    const edu = temporalElements.education_timing;
    params.p_education_school_filter = edu.school || null;
    params.p_education_degree_filter = edu.degree || null;
    params.p_education_year_filter = edu.year || null;
    params.p_education_concurrent_career = edu.concurrent_with_company || false;
  }
  
  // Default parameters
  params.p_similarity_threshold = 0.3;
  params.p_limit_count = 50;
  
  return params;
}

// EXISTING: Process chronological search
async function processChronologicalSearch(
  query: string, 
  classification: QueryClassification,
  organizationName: string
): Promise<ChronologicalConfig> {
  const filters = await translateWithoutClassificationContext(query);
  const weights = await assignWeightsWithContext(query, classification, filters);
  
  return {
    type: 'chronological',
    filters,
    weights,
    sqlFunction: `llm_integrated_chronological_search_${organizationName}`,
    sqlParameters: {
      chronological_filters: filters,
      weight_assignment: weights
    }
  };
}

// NEW: Process standard search 
async function processStandardSearch(
  query: string, 
  classification: QueryClassification
): Promise<StandardConfig> {
  // For now, standard search uses basic semantic matching
  // Could be enhanced with filter extraction in the future
  
  return {
    type: 'standard',
    enhancedFilters: {},
    searchMethod: 'semantic_with_filters'
  };
}

// STEP 1: Use the main classification API instead of specialized function
async function classifyQueryUsingMainAPI(query: string): Promise<QueryClassification> {
  try {
    // Call the main classification API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/classify-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Classification API failed: ${response.status}`);
    }

    const classification = await response.json();
    console.log('🔗 [CLASSIFICATION] Main API result:', classification);
    
    return classification;
  } catch (error) {
    console.error('🔗 [CLASSIFICATION ERROR] Main API failed, using fallback:', error);
    
    // Fallback to direct OpenAI call with the same logic as classify-query/route.ts
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are a query classification system for an alumni search database. Your job is to determine which search method will best serve the user's query.

**SEARCH TYPES:**

1. **TEMPORAL SEARCH** - For queries with specific dates, years, or time-based sequences
   - Specific years (e.g., "2018", "2019-2021", "after 2020")
   - Time-based sequences (e.g., "then became", "later moved to", "after leaving")
   - Exit timing references (e.g., "left in", "graduated in", "departed")
   - Sequential patterns with dates (e.g., "started in 2018, then moved to Google in 2020")

2. **CHRONOLOGICAL SEARCH** - For queries about career progression patterns and quality (no specific dates needed)
   - Career progression quality (e.g., "strong career progression", "rapid advancement")
   - Experience depth (e.g., "experienced", "10+ years", "senior professionals")
   - Career transitions (e.g., "moved from tech to finance", "became entrepreneurs")
   - Leadership development (e.g., "went from IC to management", "became executives")
   - Industry expertise building (e.g., "deep expertise in", "specialists in")

3. **STANDARD SEARCH** - For basic semantic matching without time or progression focus
   - Simple role/title searches (e.g., "software engineers", "marketing managers")
   - Company-based searches (e.g., "people at Google", "former Microsoft employees")
   - Location-based searches (e.g., "alumni in San Francisco")
   - Industry-based searches (e.g., "people in healthcare", "finance professionals")
   - Basic skill/background searches (e.g., "computer science graduates")

**CLASSIFICATION RULES:**

- If query contains specific years/dates OR temporal sequences → **TEMPORAL**
- If query focuses on career progression/experience quality (no specific dates) → **CHRONOLOGICAL**  
- If query is basic semantic matching → **STANDARD**

**OUTPUT FORMAT:**
Return only the search type as a simple JSON object:

{
  "type": "temporal" | "chronological" | "standard"
}

Respond only with valid JSON containing just the type field.`,
        },
        {
          role: 'user',
          content: query
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { type: 'standard' };
    }

    try {
      return JSON.parse(content);
    } catch {
      return { type: 'standard' };
    }
  }
}

// STEP 2: Enhanced Translation without Classification Context
async function translateWithoutClassificationContext(
  query: string
): Promise<ChronologicalFilters> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are translating natural language career progression queries into structured chronological filters.

**FILTER CATEGORIES:**

**Experience-Based:**
- min_years_in_industry: Minimum years in specific industry
- min_years_in_function: Minimum years in specific job function
- min_years_at_company_type: Minimum years at company types (startup/enterprise)
- career_progression_pattern: Specific advancement patterns

**Education-Based:**
- degree_level_progression: Education advancement sequence
- education_industry_alignment: Whether education matches career

**Timeline-Based:**
- gap_tolerance: Max career gaps in months (default: 6)
- concurrent_activities: Working while studying

**Pattern-Based:**
- industry_transitions: Industry change patterns
- company_size_progression: Company size advancement patterns
- geographic_mobility: Location moves for career

**PROGRESSION PATTERNS:**
- "individual_contributor_to_management"
- "entry_level_to_senior"
- "startup_to_enterprise"
- "technical_to_leadership"
- "rapid_advancement"
- "steady_progression"

**EXAMPLES:**

Query: "People with 10+ years engineering experience who became managers"
{
  "min_years_in_function": 10,
  "career_progression_pattern": "individual_contributor_to_management",
  "gap_tolerance": 6
}

Query: "Experienced professionals who moved from big tech to startups"
{
  "min_years_in_industry": 5,
  "company_size_progression": ["large", "startup"],
  "industry_transitions": ["technology"],
  "gap_tolerance": 12
}

Return only JSON with extracted filters. If no chronological patterns detected, return: {"gap_tolerance": 6}`
      },
      {
        role: 'user',
        content: `Query: "${query}"`
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return { gap_tolerance: 6 };
  }

  try {
    return JSON.parse(content);
  } catch {
    return { gap_tolerance: 6 };
  }
}

// STEP 3: Enhanced Weight Assignment with Query and Filter Context Only
async function assignWeightsWithContext(
  query: string,
  classification: QueryClassification,
  filters: ChronologicalFilters
): Promise<WeightAssignment> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are assigning importance weights for chronological career search based on query analysis and extracted filters.

**CONTEXT PROVIDED:**
Query: "${query}"
Search Type: ${classification.type}
Extracted Filters: ${JSON.stringify(filters)}

Use this context to assign optimal weights (0-1, must sum to 1.0) across:

**1. CAREER_QUALITY (0-1)**
- Total years of experience
- Job level advancement progression
- Leadership roles and responsibilities
- Industry expertise development

**2. EDUCATION_QUALITY (0-1)**
- Degree level progression
- Institution reputation
- Field relevance to career
- Academic achievements

**3. TIMELINE_PRECISION (0-1)**
- How closely timeline matches patterns
- Gap timing between transitions
- Concurrent activities handling
- Geographic mobility timing

**4. FILTER_SPECIFICITY (0-1)**
- Exact company matches
- Specific school requirements
- Precise job title matches
- Location requirements

**WEIGHT ASSIGNMENT LOGIC:**

If query mentions experience/years → Higher career_quality weight
If query mentions leadership/management → Higher career_quality + timeline_precision
If filters have specific years → Higher filter_specificity
If filters have education requirements → Higher education_quality
If filters have specific companies/schools → Higher filter_specificity

**EXAMPLES:**

Query: "10+ years experienced technology leaders"
Filters: min_years_in_function=10, career_progression_pattern="technical_to_leadership"
{
  "career_quality": 0.7,
  "education_quality": 0.1,
  "timeline_precision": 0.15,
  "filter_specificity": 0.05
}

Query: "MBA graduates who became executives"
Filters: degree_level_progression=["Bachelor's", "Master's"], career_progression_pattern="entry_level_to_senior"
{
  "career_quality": 0.4,
  "education_quality": 0.35,
  "timeline_precision": 0.2,
  "filter_specificity": 0.05
}

Return ONLY the JSON object with four weights that sum to 1.0.`
      },
      {
        role: 'user',
        content: `Assign weights based on the full context provided above.`
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return getDefaultWeights();
  }

  try {
    const weights = JSON.parse(content);
    return validateWeights(weights);
  } catch {
    return getDefaultWeights();
  }
}

function validateWeights(weights: any): WeightAssignment {
  const requiredFields = ['career_quality', 'education_quality', 'timeline_precision', 'filter_specificity'];
  
  for (const field of requiredFields) {
    if (typeof weights[field] !== 'number') {
      return getDefaultWeights();
    }
  }

  const sum = weights.career_quality + weights.education_quality + weights.timeline_precision + weights.filter_specificity;
  
  if (Math.abs(sum - 1.0) > 0.01) {
    // Normalize if close to 1.0
    return {
      career_quality: weights.career_quality / sum,
      education_quality: weights.education_quality / sum,
      timeline_precision: weights.timeline_precision / sum,
      filter_specificity: weights.filter_specificity / sum
    };
  }

  return {
    career_quality: Math.max(0, weights.career_quality),
    education_quality: Math.max(0, weights.education_quality),
    timeline_precision: Math.max(0, weights.timeline_precision),
    filter_specificity: Math.max(0, weights.filter_specificity)
  };
}

function getDefaultWeights(): WeightAssignment {
  return {
    career_quality: 0.4,
    education_quality: 0.25,
    timeline_precision: 0.25,
    filter_specificity: 0.1
  };
} 