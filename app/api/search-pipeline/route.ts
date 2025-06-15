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
  // Basic search filters (MISSING - this is the bug!)
  school_filter?: string;
  company_filter?: string;
  industry_filter?: string;
  title_filter?: string;
  location_filter?: string;
  
  // Experience-based filters
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
  sqlFunction: string;
  sqlParameters: {
      chronological_filters: ChronologicalFilters;
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
    console.log(`[PIPELINE DEBUG] 🚀 Pipeline started at ${new Date().toISOString()}`);
    console.log(`[PIPELINE DEBUG] 📝 Request parameters:`, {
      query: `"${query}"`,
      organizationName,
      isDemo,
      queryLength: query?.length || 0
    });
    
    if (!query) {
      console.log(`[PIPELINE DEBUG] ❌ Missing query parameter`);
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // STEP 1: Universal Classification
    console.log('🔍 [STEP 1] Classifying search query...');
    console.log(`[PIPELINE DEBUG] 🎯 Starting classification step`);
    const classification = await classifyQueryUsingMainAPI(query);
    processingSteps.push('classification');
    llmCalls++;
    
    console.log(`[PIPELINE DEBUG] ✅ Classification completed:`, {
      type: classification.type,
      processingTime: Date.now() - startTime + 'ms',
      llmCallsUsed: llmCalls
    });
    
    // STEP 2: Route to Appropriate Translation
    console.log(`[PIPELINE DEBUG] 🔀 Routing to ${classification.type} processing`);
    let searchConfig: SearchConfig;
    
    switch (classification.type) {
      case 'temporal':
        console.log('🕐 [STEP 2] Processing temporal search...');
        console.log(`[PIPELINE DEBUG] 🕐 Starting temporal extraction and processing`);
        searchConfig = await processTemporalSearch(query, classification, organizationName);
        processingSteps.push('temporal_extraction');
        llmCalls++;
        console.log(`[PIPELINE DEBUG] ✅ Temporal processing completed:`, {
          sqlFunction: searchConfig.sqlFunction,
          hasTemporalElements: !!searchConfig.temporalElements,
          elementCount: Object.keys(searchConfig.temporalElements || {}).length
        });
        break;
        
      case 'chronological':
        console.log('📈 [STEP 2] Processing chronological search...');
        console.log(`[PIPELINE DEBUG] 📈 Starting chronological filter translation`);
        searchConfig = await processChronologicalSearch(query, classification, organizationName);
        processingSteps.push('chronological_translation');
        llmCalls += 1;
        console.log(`[PIPELINE DEBUG] ✅ Chronological processing completed:`, {
          sqlFunction: searchConfig.sqlFunction,
          filterCount: Object.keys(searchConfig.filters || {}).length
        });
        break;
        
      case 'standard':
        console.log('📊 [STEP 2] Processing standard search...');
        console.log(`[PIPELINE DEBUG] 📊 Starting standard search enhancement`);
        searchConfig = await processStandardSearch(query, classification);
        processingSteps.push('standard_enhancement');
        llmCalls++;
        console.log(`[PIPELINE DEBUG] ✅ Standard processing completed:`, {
          searchMethod: searchConfig.searchMethod,
          hasEnhancedFilters: !!searchConfig.enhancedFilters,
          filterCount: Object.keys(searchConfig.enhancedFilters || {}).length
        });
        break;
    }

    // STEP 3: Return Unified Response
    console.log(`[PIPELINE DEBUG] 📤 Preparing unified response`);
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
    
    console.log(`[PIPELINE DEBUG] 🎉 Pipeline completed successfully:`, {
      finalSearchType: response.searchType,
      totalProcessingTime: response.metadata.processingTimeMs + 'ms',
      totalLLMCalls: response.metadata.llmCalls,
      configReady: true
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('🔍 [PIPELINE ERROR] Search pipeline failed:', error);
    console.error(`[PIPELINE DEBUG] ❌ Critical pipeline error:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack',
      processingTime: Date.now() - startTime + 'ms',
      completedSteps: processingSteps,
      llmCallsBeforeError: llmCalls
    });
    
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
    
    console.log(`[PIPELINE DEBUG] 🔄 Returning error fallback response:`, errorResponse);
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
  console.log(`[PIPELINE TEMPORAL] 🕐 Starting temporal element extraction for: "${query}"`);
  
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

  console.log(`[PIPELINE TEMPORAL] 🤖 OpenAI temporal extraction response received`);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.log(`[PIPELINE TEMPORAL] ⚠️ Empty response from OpenAI, returning empty object`);
    return {};
  }

  try {
    const parsed = JSON.parse(content);
    console.log(`[PIPELINE TEMPORAL] ✅ Temporal elements extracted successfully:`, parsed);
    console.log(`[PIPELINE TEMPORAL] 📊 Extraction summary:`, {
      hasExitYear: !!parsed.exit_year,
      hasYearRanges: !!parsed.year_ranges?.length,
      hasSubsequentFunctions: !!parsed.subsequent_functions?.length,
      hasSequenceType: !!parsed.sequence_type,
      hasTimingConstraints: !!parsed.timing_constraints,
      hasEducationTiming: !!parsed.education_timing
    });
    return parsed;
  } catch (error) {
    console.error(`[PIPELINE TEMPORAL] ❌ Failed to parse temporal extraction response:`, {
      error: error,
      rawContent: content
    });
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
  console.log(`[PIPELINE CHRONOLOGICAL] 🔄 Processing chronological search for: "${query}"`);
  
  // Step 1: Extract chronological filters using LLM
  console.log(`[PIPELINE CHRONOLOGICAL] 📊 Extracting chronological filters`);
  const filters = await translateWithoutClassificationContext(query);
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Filters extracted:`, filters);
  
  // Step 2: Create search configuration (removed weight assignment)
  const searchConfig: ChronologicalConfig = {
    type: 'chronological',
    filters: filters,
    sqlFunction: 'llm_integrated_chronological_search_chick_fil_a',
    sqlParameters: {
      chronological_filters: filters
    }
  };
  
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Chronological search config created:`, searchConfig);
  return searchConfig;
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
    console.log(`[PIPELINE CLASSIFY] 🎯 Starting classification for: "${query}"`);
    
    // Call the main classification API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/classify-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    console.log(`[PIPELINE CLASSIFY] 📡 Classification API response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`Classification API failed: ${response.status}`);
    }

    const classification = await response.json();
    console.log('🔗 [CLASSIFICATION] Main API result:', classification);
    console.log(`[PIPELINE CLASSIFY] ✅ Main API classification successful: ${classification.type}`);
    
    return classification;
  } catch (error) {
    console.error('🔗 [CLASSIFICATION ERROR] Main API failed, using fallback:', error);
    console.error(`[PIPELINE CLASSIFY] ❌ Main API failed, switching to fallback:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    console.log(`[PIPELINE CLASSIFY] 🔄 Starting OpenAI fallback classification`);
    
    // Fallback to direct OpenAI call with the same logic as classify-query/route.ts
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are a search query classifier. Analyze the user's query and determine the most appropriate search type.

**SEARCH TYPES:**

1. **TEMPORAL SEARCH** - For queries with specific dates, years, or time-based sequences
   - Specific years (e.g., "2018", "2019-2021", "after 2020")
   - Time-based sequences (e.g., "then became", "later moved to", "after leaving")
   - Exit timing references (e.g., "left in", "graduated in", "departed")

2. **CHRONOLOGICAL SEARCH** - For queries about career/education progression patterns and quality (no specific dates needed)
   - Career progression quality (e.g., "strong career progression", "rapid advancement")
   - Experience depth (e.g., "experienced", "10+ years", "senior professionals")
   - Career transitions (e.g., "moved from tech to finance", "became entrepreneurs")
   - Leadership development (e.g., "went from IC to management", "became executives")
   - Education and career progression combined (e.g., "studied engineering then became product managers", "MBA graduates who joined consulting")
   - General life/professional progression patterns (e.g., "people who advanced quickly", "alumni with impressive trajectories")

3. **STANDARD SEARCH** - For basic semantic matching without time or progression focus
   - Simple role/title searches (e.g., "software engineers", "marketing managers")
   - Company-based searches (e.g., "people at Google", "former Microsoft employees")
   - Location-based searches (e.g., "alumni in San Francisco")
   - Industry-based searches (e.g., "people in healthcare", "finance professionals")

**CRITICAL DISTINCTION - TEMPORAL vs CHRONOLOGICAL:**

**TEMPORAL = Specific Dates/Years/Timing:**
- "People who left in 2019" → TEMPORAL
- "Graduated in 2020 and became consultants" → TEMPORAL  
- "Worked here 2018-2021 then joined startups" → TEMPORAL

**CHRONOLOGICAL = Career Progression Patterns (no specific dates):**
- "Find people who went to Duke University and are now working at Google → CHRONOLOGICAL
- "Experienced professionals who became executives" → CHRONOLOGICAL
- "Alumni who moved from technical roles to leadership" → CHRONOLOGICAL

**TRICKY EDGE CASES:**

**Contains "years" but NO specific dates = CHRONOLOGICAL:**
- "People with 10+ years experience" → CHRONOLOGICAL (experience depth, no specific years)
- "Professionals with 5+ years in finance" → CHRONOLOGICAL (experience pattern)

**Contains progression words WITH specific dates = TEMPORAL:**
- "Advanced to senior roles after leaving in 2020" → TEMPORAL (specific year)
- "Became managers after graduating in 2019" → TEMPORAL (specific graduation year)

**Sequential patterns WITHOUT dates = CHRONOLOGICAL:**
- "People who went from junior to senior roles" → CHRONOLOGICAL (progression pattern)
- "Alumni who moved from IC to management" → CHRONOLOGICAL (career transition)

**Sequential patterns WITH dates = TEMPORAL:**
- "Went from junior to senior between 2019-2021" → TEMPORAL (specific timeframe)
- "Moved to management after 2020" → TEMPORAL (specific year reference)

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

    console.log(`[PIPELINE CLASSIFY] 🤖 OpenAI fallback response received`);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.log(`[PIPELINE CLASSIFY] ⚠️ Empty response from OpenAI, defaulting to standard`);
      return { type: 'standard' };
    }

    try {
      const parsed = JSON.parse(content);
      console.log(`[PIPELINE CLASSIFY] ✅ OpenAI fallback successful: ${parsed.type}`);
      return parsed;
    } catch {
      console.log(`[PIPELINE CLASSIFY] ❌ Failed to parse OpenAI response, defaulting to standard`);
      return { type: 'standard' };
    }
  }
}

// STEP 2: Enhanced Translation without Classification Context
async function translateWithoutClassificationContext(
  query: string
): Promise<ChronologicalFilters> {
  console.log(`[PIPELINE CHRONOLOGICAL] 📈 Starting chronological filter translation for: "${query}"`);
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are translating natural language career progression queries into structured chronological filters.

**COMPREHENSIVE FILTER CATEGORIES:**

**Basic Search Filters:**
- school_filter: Extract specific schools/universities mentioned (string)
- company_filter: Extract specific companies mentioned (string)  
- industry_filter: Extract specific industries mentioned (string)
- title_filter: Extract specific job titles mentioned (string)
- location_filter: Extract specific locations mentioned (string)

**Experience-Based Filters:**
- min_years_in_industry: Extract from "5+ years in tech", "experienced in finance" (number)
- min_years_in_function: Extract from "10+ years engineering", "seasoned marketing" (number)
- total_experience_years: Extract from "experienced professionals", "10+ years total" (number)
- career_progression_pattern: Specific advancement patterns (string)

**Education-Based Filters:**
- degree_level_progression: Education sequence like ["Bachelor's", "Master's", "PhD"] (array)
- education_industry_alignment: Whether education field matches career industry (boolean)

**Timeline-Based Filters:**
- gap_tolerance: Max acceptable career gaps in months, default 6 (number)
- concurrent_activities: Working while studying, part-time education (boolean)

**Pattern-Based Filters:**
- industry_transitions: Industry change patterns like ["finance", "technology"] (array)
- company_size_progression: Company size advancement like ["startup", "large"] (array)  
- geographic_mobility: Moved locations for career advancement (boolean)

**PROGRESSION PATTERNS:**
- "individual_contributor_to_management" - IC → Manager
- "entry_level_to_senior" - Junior → Senior roles
- "startup_to_enterprise" - Small → Large companies
- "technical_to_leadership" - Engineer → CTO/VP
- "rapid_advancement" - Fast promotions
- "steady_progression" - Consistent growth
- "industry_switcher" - Changed industries
- "entrepreneur_path" - Became founder/entrepreneur

**ENHANCED EXAMPLES:**

Query: "Find someone who worked at Chick Fil A and then went to Georgetown University"
{
  "company_filter": "Chick Fil A",
  "school_filter": "Georgetown University", 
  "career_progression_pattern": "startup_to_enterprise",
  "gap_tolerance": 6
}

Query: "Find me people who went to college and then worked at Chick Fil A"
{
  "company_filter": "Chick Fil A",
  "degree_level_progression": ["Bachelor's"],
  "gap_tolerance": 6
}

Query: "MBA graduates who became senior executives"
{
  "degree_level_progression": ["Bachelor's", "Master's"],
  "career_progression_pattern": "entry_level_to_senior",
  "min_years_in_function": 5,
  "education_industry_alignment": true,
  "gap_tolerance": 12
}

Query: "People with 10+ years engineering experience who moved to management"
{
  "title_filter": "engineering",
  "min_years_in_function": 10,
  "total_experience_years": 10,
  "career_progression_pattern": "individual_contributor_to_management",
  "gap_tolerance": 6
}

Query: "Tech professionals at Google who worked while getting their Master's degree"
{
  "company_filter": "Google",
  "industry_filter": "technology",
  "min_years_in_industry": 3,
  "degree_level_progression": ["Bachelor's", "Master's"],
  "concurrent_activities": true,
  "education_industry_alignment": true,
  "gap_tolerance": 0
}

Query: "Experienced professionals who moved from big tech to startups"
{
  "min_years_in_industry": 5,
  "total_experience_years": 7,
  "company_size_progression": ["large", "startup"],
  "industry_transitions": ["technology"],
  "career_progression_pattern": "startup_to_enterprise",
  "gap_tolerance": 6
}

Query: "People who studied abroad and had international careers"
{
  "geographic_mobility": true,
  "education_industry_alignment": false,
  "gap_tolerance": 12,
  "total_experience_years": 5
}

**EXTRACTION RULES:**
- Extract specific institutions: "Georgetown University" → school_filter: "Georgetown University"
- **DO NOT extract generic education terms**: "college", "university", "school" → school_filter: null
- **Only extract when specific institution names are mentioned**: "Harvard", "MIT", "Stanford University" → school_filter: "Stanford University"
- **Generic education requirements go to degree_level_progression**: "college graduates" → degree_level_progression: ["Bachelor's"]
- Extract specific companies: "Chick Fil A", "Google", "Apple" → company_filter: "Company Name"
- Extract industries: "tech", "finance", "healthcare" → industry_filter: "technology"
- Extract job titles: "engineering", "marketing", "sales" → title_filter: "engineering"
- Extract locations: "New York", "San Francisco", "remote" → location_filter: "New York"
- Extract numeric values for experience requirements (e.g., "10+ years" → 10)
- Identify career progression patterns (e.g., "IC to management" → "individual_contributor_to_management")
- Detect education requirements and progressions
- Identify mobility and transition patterns
- Set reasonable defaults for timeline tolerances

**IMPORTANT SCHOOL FILTER EXAMPLES:**
✅ CORRECT - Specific institutions:
- "Georgetown University graduates" → school_filter: "Georgetown University"
- "people from Harvard" → school_filter: "Harvard"
- "MIT alumni" → school_filter: "MIT"
- "Stanford MBA graduates" → school_filter: "Stanford"

❌ INCORRECT - Generic terms (DO NOT extract):
- "college graduates" → school_filter: null, degree_level_progression: ["Bachelor's"]
- "university alumni" → school_filter: null, degree_level_progression: ["Bachelor's"]
- "people who went to school" → school_filter: null
- "people who went to college" → school_filter: null, degree_level_progression: ["Bachelor's"]
- "business school graduates" → school_filter: null, degree_level_progression: ["Master's"]

**ADDITIONAL EDGE CASES:**

**Company Name Edge Cases:**
✅ CORRECT:
- "ex-Google employees" → company_filter: "Google"
- "former Apple workers" → company_filter: "Apple"
- "people who left Microsoft" → company_filter: "Microsoft"
- "alumni from McKinsey" → company_filter: "McKinsey"

❌ INCORRECT - Generic company terms:
- "startup employees" → company_filter: null, company_size_progression: ["startup"]
- "big tech workers" → company_filter: null, industry_filter: "technology"
- "consulting firm alumni" → company_filter: null, industry_filter: "consulting"
- "Fortune 500 employees" → company_filter: null, company_size_progression: ["large"]

**Industry Edge Cases:**
✅ CORRECT:
- "tech professionals" → industry_filter: "technology"
- "healthcare workers" → industry_filter: "healthcare"
- "financial services" → industry_filter: "finance"

❌ INCORRECT - Too generic:
- "professionals" → industry_filter: null
- "workers" → industry_filter: null
- "employees" → industry_filter: null

**Title/Role Edge Cases:**
✅ CORRECT:
- "software engineers" → title_filter: "software engineer"
- "product managers" → title_filter: "product manager"
- "data scientists" → title_filter: "data scientist"

❌ INCORRECT - Too generic or ambiguous:
- "managers" → title_filter: null, career_progression_pattern: "individual_contributor_to_management"
- "executives" → title_filter: null, career_progression_pattern: "entry_level_to_senior"
- "leaders" → title_filter: null, career_progression_pattern: "individual_contributor_to_management"
- "professionals" → title_filter: null

**Location Edge Cases:**
✅ CORRECT:
- "San Francisco Bay Area" → location_filter: "San Francisco"
- "NYC" → location_filter: "New York"
- "remote workers" → location_filter: "remote"

❌ INCORRECT - Too generic:
- "West Coast" → location_filter: null, geographic_mobility: true
- "East Coast" → location_filter: null, geographic_mobility: true
- "international" → location_filter: null, geographic_mobility: true

**Experience Level Edge Cases:**
✅ CORRECT:
- "5+ years experience" → min_years_in_industry: 5
- "senior level" → total_experience_years: 7
- "experienced professionals" → total_experience_years: 5

❌ INCORRECT - Ambiguous terms:
- "seasoned" → total_experience_years: 7 (interpret as experienced)
- "junior" → total_experience_years: 2 (interpret as early career)
- "entry-level" → total_experience_years: 1

**Degree Level Edge Cases:**
✅ CORRECT:
- "PhD holders" → degree_level_progression: ["Bachelor's", "Master's", "PhD"]
- "MBA graduates" → degree_level_progression: ["Bachelor's", "Master's"]
- "undergraduate alumni" → degree_level_progression: ["Bachelor's"]

❌ INCORRECT - Generic education terms:
- "educated professionals" → degree_level_progression: ["Bachelor's"]
- "degree holders" → degree_level_progression: ["Bachelor's"]
- "graduates" → degree_level_progression: ["Bachelor's"]

**Temporal/Sequence Edge Cases:**
✅ CORRECT:
- "people who worked at X then Y" → career_progression_pattern: "startup_to_enterprise" (if applicable)
- "went to school while working" → concurrent_activities: true
- "career changers" → industry_transitions: ["previous", "current"]

❌ INCORRECT - Don't over-interpret:
- "career growth" → career_progression_pattern: "steady_progression"
- "professional development" → career_progression_pattern: null
- "advancement" → career_progression_pattern: "entry_level_to_senior"

**Ambiguous Company References:**
✅ CORRECT:
- "FAANG employees" → industry_filter: "technology" (don't extract specific companies)
- "Big 4 consultants" → industry_filter: "consulting"
- "investment bank analysts" → industry_filter: "finance"

❌ INCORRECT:
- "FAANG" → company_filter: "FAANG" (this is not a real company)
- "Big 4" → company_filter: "Big 4" (this is not a real company)

**Salary/Compensation Edge Cases:**
- "high earners" → total_experience_years: 7 (implies senior level)
- "well-compensated" → career_progression_pattern: "entry_level_to_senior"
- "six-figure salaries" → total_experience_years: 5

**Geographic Mobility Edge Cases:**
- "relocated for work" → geographic_mobility: true
- "moved cities" → geographic_mobility: true
- "international experience" → geographic_mobility: true
- "worked abroad" → geographic_mobility: true

Return comprehensive JSON with all applicable filters. If no chronological patterns detected, return: {"gap_tolerance": 6}`
      },
      {
        role: 'user',
        content: `Query: "${query}"`
      }
    ]
  });

  console.log(`[PIPELINE CHRONOLOGICAL] 🤖 OpenAI filter translation response received`);

  // ADD DETAILED DEBUGGING: Log the raw response
  const content = response.choices[0]?.message?.content;
  console.log(`[PIPELINE CHRONOLOGICAL] 🔍 RAW LLM RESPONSE:`, {
    hasContent: !!content,
    contentLength: content?.length || 0,
    rawContent: content,
    responseChoices: response.choices?.length || 0,
    model: response.model,
    usage: response.usage
  });

  if (!content) {
    console.log(`[PIPELINE CHRONOLOGICAL] ⚠️ Empty response from OpenAI, returning default filters`);
    return { gap_tolerance: 6 };
  }

  try {
    const parsed = JSON.parse(content);
    
    // ADD DETAILED DEBUGGING: Log the parsed structure
    console.log(`[PIPELINE CHRONOLOGICAL] 🔍 PARSED LLM STRUCTURE:`, {
      parsedSuccessfully: true,
      parsedKeys: Object.keys(parsed),
      parsedValues: parsed,
      hasBasicFilters: {
        school_filter: !!parsed.school_filter,
        company_filter: !!parsed.company_filter,
        industry_filter: !!parsed.industry_filter,
        title_filter: !!parsed.title_filter,
        location_filter: !!parsed.location_filter
      },
      hasExperienceFilters: {
        min_years_in_industry: !!parsed.min_years_in_industry,
        min_years_in_function: !!parsed.min_years_in_function,
        total_experience_years: !!parsed.total_experience_years,
        career_progression_pattern: !!parsed.career_progression_pattern
      },
      hasEducationFilters: {
        degree_level_progression: !!parsed.degree_level_progression,
        education_industry_alignment: !!parsed.education_industry_alignment
      },
      hasTimelineFilters: {
        gap_tolerance: parsed.gap_tolerance,
        concurrent_activities: !!parsed.concurrent_activities
      },
      hasPatternFilters: {
        industry_transitions: !!parsed.industry_transitions,
        company_size_progression: !!parsed.company_size_progression,
        geographic_mobility: !!parsed.geographic_mobility
      }
    });
    
    console.log(`[PIPELINE CHRONOLOGICAL] ✅ Chronological filters extracted successfully:`, parsed);
    console.log(`[PIPELINE CHRONOLOGICAL] 📊 Filter summary:`, {
      experienceFilters: {
        hasMinYearsIndustry: !!parsed.min_years_in_industry,
        hasMinYearsFunction: !!parsed.min_years_in_function,
        hasTotalExperience: !!parsed.total_experience_years,
        hasProgressionPattern: !!parsed.career_progression_pattern
      },
      educationFilters: {
        hasDegreeProgression: !!parsed.degree_level_progression?.length,
        hasEducationAlignment: !!parsed.education_industry_alignment
      },
      timelineFilters: {
        gapTolerance: parsed.gap_tolerance || 6,
        hasConcurrentActivities: !!parsed.concurrent_activities
      },
      patternFilters: {
        hasIndustryTransitions: !!parsed.industry_transitions?.length,
        hasCompanySizeProgression: !!parsed.company_size_progression?.length,
        hasGeographicMobility: !!parsed.geographic_mobility
      },
      totalFilterCount: Object.keys(parsed).length
    });
    return parsed;
  } catch (error) {
    console.error(`[PIPELINE CHRONOLOGICAL] ❌ Failed to parse filter translation response:`, {
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack',
      rawContent: content,
      contentPreview: content?.substring(0, 200) + (content?.length > 200 ? '...' : ''),
      parseAttempt: 'JSON.parse failed'
    });
    
    // ADD DETAILED DEBUGGING: Try to identify the parsing issue
    console.error(`[PIPELINE CHRONOLOGICAL] 🔍 PARSING DEBUG:`, {
      contentType: typeof content,
      isString: typeof content === 'string',
      startsWithBrace: content?.startsWith('{'),
      endsWithBrace: content?.endsWith('}'),
      hasNewlines: content?.includes('\n'),
      hasBackticks: content?.includes('```'),
      firstChar: content?.[0],
      lastChar: content?.[content.length - 1]
    });
    
    return { gap_tolerance: 6 };
  }
} 