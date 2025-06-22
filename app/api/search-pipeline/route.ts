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
  // Basic search filters
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
  searchMethod: 'semantic_with_filters' | 'comprehensive_sql_filtering';
}

type SearchConfig = TemporalConfig | ChronologicalConfig | StandardConfig;

interface SearchPipelineResponse {
  searchType: 'temporal' | 'chronological' | 'standard';
  classification: QueryClassification;
  searchConfig: SearchConfig;
  shouldExecuteSearch: boolean;
  fallbackToStandard?: boolean;
  // NEW: Search expansion results
  expansionResults?: {
    variants: SearchExpansionVariant[];
    additionalSearchConfigs: ChronologicalConfig[];
  };
  metadata: {
    processingSteps: string[];
    llmCalls: number;
    processingTimeMs: number;
  };
}

// NEW: Search expansion interfaces
interface SearchExpansionVariant {
  natural_language_query: string;
  filters: ChronologicalFilters;
}

interface SearchExpansionResponse {
  expansion_variants: SearchExpansionVariant[];
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
    let expansionResults: { variants: SearchExpansionVariant[]; additionalSearchConfigs: ChronologicalConfig[]; } | undefined;
    
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
        
        try {
          console.log(`[PIPELINE DEBUG] 📈 DETAILED: About to call processChronologicalSearchWithExpansion`);
          console.log(`[PIPELINE DEBUG] 📈 DETAILED: Input parameters:`, {
            query: `"${query}"`,
            classification: classification,
            organizationName: organizationName
          });
          
          const { primaryConfig, expansionResults: chronologicalExpansion } = await processChronologicalSearchWithExpansion(query, classification, organizationName);
          
          console.log(`[PIPELINE DEBUG] 📈 DETAILED: processChronologicalSearchWithExpansion completed successfully`);
          console.log(`[PIPELINE DEBUG] 📈 DETAILED: Primary config:`, primaryConfig);
          console.log(`[PIPELINE DEBUG] 📈 DETAILED: Expansion results:`, chronologicalExpansion);
          console.log(`[PIPELINE DEBUG] 📈 DETAILED: Expansion variants count:`, chronologicalExpansion?.variants?.length || 0);
          console.log(`[PIPELINE DEBUG] 📈 DETAILED: First variant:`, chronologicalExpansion?.variants?.[0] || 'none');
          
          searchConfig = primaryConfig;
          expansionResults = chronologicalExpansion;
          processingSteps.push('chronological_translation', 'search_expansion_prepared');
          llmCalls += 1 + chronologicalExpansion.variants.length; // +1 for primary filters, +1 for each expansion variant
          
          console.log(`[PIPELINE DEBUG] ✅ Chronological processing completed:`, {
            sqlFunction: searchConfig.sqlFunction,
            filterCount: Object.keys(searchConfig.filters || {}).length,
            expansionVariants: chronologicalExpansion.variants.length,
            additionalConfigs: chronologicalExpansion.additionalSearchConfigs.length,
            hasExpansionResults: !!expansionResults,
            expansionResultsVariantCount: expansionResults?.variants?.length || 0
          });
          
        } catch (chronologicalError) {
          console.error(`[PIPELINE DEBUG] ❌ Chronological processing failed:`, {
            error: chronologicalError,
            message: chronologicalError instanceof Error ? chronologicalError.message : 'Unknown error',
            stack: chronologicalError instanceof Error ? chronologicalError.stack : 'No stack'
          });
          
          // Fallback to basic chronological processing without expansion
          console.log(`[PIPELINE DEBUG] 🔄 Falling back to basic chronological processing`);
          searchConfig = await processChronologicalSearch(query, classification, organizationName);
          expansionResults = undefined;
          processingSteps.push('chronological_translation', 'expansion_fallback');
          llmCalls += 1;
        }
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
    console.log(`[PIPELINE DEBUG] 📤 DETAILED: Response preparation details:`, {
      searchType: classification.type,
      hasSearchConfig: !!searchConfig,
      hasExpansionResults: !!expansionResults,
      expansionVariantCount: expansionResults?.variants?.length || 0,
      expansionConfigCount: expansionResults?.additionalSearchConfigs?.length || 0,
      processingSteps: processingSteps,
      llmCalls: llmCalls
    });
    
    const response: SearchPipelineResponse = {
      searchType: classification.type,
      classification,
      searchConfig,
      shouldExecuteSearch: true,
      expansionResults,
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
    
    console.log(`[PIPELINE DEBUG] 📤 FINAL RESPONSE INSPECTION:`, {
      hasExpansionResults: !!response.expansionResults,
      expansionVariantCount: response.expansionResults?.variants?.length || 0,
      expansionConfigCount: response.expansionResults?.additionalSearchConfigs?.length || 0,
      firstVariant: response.expansionResults?.variants?.[0] || 'none',
      responseKeys: Object.keys(response),
      expansionResultsKeys: response.expansionResults ? Object.keys(response.expansionResults) : 'none'
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
        searchMethod: 'comprehensive_sql_filtering' // Use SQL filtering instead of semantic search even for errors
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
    model: 'gpt-4.1-mini',
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

// EXISTING: Process chronologeal search
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

// NEW: Process chronological search with expansion
async function processChronologicalSearchWithExpansion(
  query: string, 
  classification: QueryClassification,
  organizationName: string
): Promise<{
  primaryConfig: ChronologicalConfig;
  expansionResults: {
    variants: SearchExpansionVariant[];
    additionalSearchConfigs: ChronologicalConfig[];
  };
}> {
  console.log(`[PIPELINE CHRONOLOGICAL] 🔄 Processing chronological search with expansion for: "${query}"`);
  
  // Step 1: Extract chronological filters using LLM
  console.log(`[PIPELINE CHRONOLOGICAL] 📊 Extracting chronological filters`);
  const filters = await translateWithoutClassificationContext(query);
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Filters extracted:`, filters);
  
  // Step 2: Create primary search configuration
  const primaryConfig: ChronologicalConfig = {
    type: 'chronological',
    filters: filters,
    sqlFunction: `llm_integrated_chronological_search_${organizationName}`,
    sqlParameters: {
      chronological_filters: filters
    }
  };
  
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Primary chronological search config created:`, primaryConfig);
  
  // Step 3: Generate search expansion variants
  console.log(`[PIPELINE CHRONOLOGICAL] 🔍 Generating search expansion variants`);
  const expansionVariants = await generateSearchExpansionVariants(query, filters);
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Generated ${expansionVariants.length} expansion variants`);
  
  // Step 4: Create additional search configurations for each variant
  const additionalSearchConfigs: ChronologicalConfig[] = expansionVariants.map((variant, index) => {
    console.log(`[PIPELINE CHRONOLOGICAL] 🔧 Creating search config for variant ${index + 1}: "${variant.natural_language_query}"`);
    
    return {
      type: 'chronological',
      filters: variant.filters,
      sqlFunction: `llm_integrated_chronological_search_${organizationName}`,
      sqlParameters: {
        chronological_filters: variant.filters
      }
    };
  });
  
  console.log(`[PIPELINE CHRONOLOGICAL] ✅ Created ${additionalSearchConfigs.length} additional search configurations`);
  
  return {
    primaryConfig,
    expansionResults: {
      variants: expansionVariants,
      additionalSearchConfigs
    }
  };
}

// NEW: Process standard search 
async function processStandardSearch(
  query: string, 
  classification: QueryClassification
): Promise<StandardConfig> {
  console.log(`[PIPELINE STANDARD] 📊 Processing standard search for: "${query}"`);
  
  // Extract comprehensive standard filters using LLM
  const enhancedFilters = await translateStandardSearchQuery(query);
  console.log(`[PIPELINE STANDARD] ✅ Enhanced filters extracted:`, enhancedFilters);
  
  return {
    type: 'standard',
    enhancedFilters,
    searchMethod: 'comprehensive_sql_filtering' // Always use SQL filtering instead of semantic search
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
      model: 'gpt-4.1-mini',
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
    model: 'gpt-4.1-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are an expert data extraction system. Your sole purpose is to meticulously analyze a user's query and transform it into a structured JSON object. You are hyper-attentive to detail and never miss an entity.

**RESPONSE FORMAT:**
You MUST provide your response in exactly this two-part format:

**PART 1 - REASONING SCRATCHPAD:**
\`\`\`reasoning
STEP 1: ENTITY INVENTORY
- ALL COMPANIES MENTIONED: [list every single company name you found]
- ALL SCHOOLS MENTIONED: [list every single school/university name you found]
- ALL TITLES MENTIONED: [list every single job title/role you found]
- ALL INDUSTRIES MENTIONED: [list every single industry you found]
- ALL LOCATIONS MENTIONED: [list every single location you found]
- ALL EXPERIENCE INDICATORS: [list any experience/years mentions]
- ALL PROGRESSION PATTERNS: [list any career progression keywords]

STEP 2: FILTER SELECTION LOGIC
For each filter I'm setting in the final JSON, I will explain my reasoning:
- [Filter name]: [One sentence explaining why I chose this value based on the extraction rules]
\`\`\`

**PART 2 - FINAL JSON:**
\`\`\`json
{
  // Your final JSON object here
}
\`\`\`

**ENHANCED ENTITY EXTRACTION PROCESS:**

**STEP 1: EXTRACT ALL ENTITIES**
First, identify EVERY entity mentioned in the query:
- ALL COMPANIES: Extract every company name mentioned
- ALL SCHOOLS: Extract every school/university name mentioned  
- ALL TITLES: Extract every job title/role mentioned
- ALL INDUSTRIES: Extract every industry mentioned
- ALL LOCATIONS: Extract every location mentioned

**STEP 2: SMART ENTITY SELECTION**
Then choose the most relevant entity for each filter using these rules:

**COMPANY SELECTION RULES:**
- If multiple companies with "then/after": Choose the LAST mentioned (target destination)
- If "former X employees": Choose X as company_filter
- If "X alumni at Y": Choose X as company_filter (source company)
- If "people who left X for Y": Choose X as company_filter (source company)
- If "worked at X and Y": Choose the LAST mentioned

**SCHOOL SELECTION RULES:**
- If multiple schools with "then/after": Choose the LAST mentioned (most recent)
- If "X graduates who went to Y": Choose X as school_filter (source school)
- If "studied at X then Y": Choose Y as school_filter (most recent)
- If undergraduate + graduate school mentioned: Choose graduate school

**TITLE SELECTION RULES:**
- If multiple titles: Choose the most SPECIFIC one
- If progression mentioned (junior → senior): Choose the TARGET level
- If "former X who became Y": Choose X as title_filter (source role)

**INDUSTRY SELECTION RULES:**
- If multiple industries with transition: Choose the TARGET industry
- If "from X to Y industry": Choose Y as industry_filter

**LOCATION SELECTION RULES:**
- If multiple locations: Choose the most SPECIFIC one
- If "moved from X to Y": Choose Y as location_filter (current location)

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

\`\`\`reasoning
STEP 1: ENTITY INVENTORY
- ALL COMPANIES MENTIONED: ["Chick Fil A"]
- ALL SCHOOLS MENTIONED: ["Georgetown University"]
- ALL TITLES MENTIONED: []
- ALL INDUSTRIES MENTIONED: []
- ALL LOCATIONS MENTIONED: []
- ALL EXPERIENCE INDICATORS: []
- ALL PROGRESSION PATTERNS: ["then went to" - indicates career progression]

STEP 2: FILTER SELECTION LOGIC
- company_filter: "Chick Fil A" - The source company where the person worked
- school_filter: "Georgetown University" - Specific institution mentioned for subsequent education
- career_progression_pattern: "startup_to_enterprise" - Moving from work to higher education shows advancement
- gap_tolerance: 6 - Default value for career transitions
\`\`\`

\`\`\`json
{
  "company_filter": "Chick Fil A",
  "school_filter": "Georgetown University", 
  "career_progression_pattern": "startup_to_enterprise",
  "gap_tolerance": 6
}
\`\`\`

Query: "Find me people who went to college and then worked at Chick Fil A"

\`\`\`reasoning
STEP 1: ENTITY INVENTORY
- ALL COMPANIES MENTIONED: ["Chick Fil A"]
- ALL SCHOOLS MENTIONED: ["college" - generic term, not specific institution]
- ALL TITLES MENTIONED: []
- ALL INDUSTRIES MENTIONED: []
- ALL LOCATIONS MENTIONED: []
- ALL EXPERIENCE INDICATORS: []
- ALL PROGRESSION PATTERNS: ["then worked at" - indicates education to work progression]

STEP 2: FILTER SELECTION LOGIC
- company_filter: "Chick Fil A" - Specific company mentioned as destination
- school_filter: null - "college" is too generic, doesn't extract specific institution
- degree_level_progression: ["Bachelor's"] - "college" implies undergraduate degree
- gap_tolerance: 6 - Default for education to work transition
\`\`\`

\`\`\`json
{
  "company_filter": "Chick Fil A",
  "degree_level_progression": ["Bachelor's"],
  "gap_tolerance": 6
}
\`\`\`

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
        industry_transitions: !!parsed.industry_transitions?.length,
        company_size_progression: !!parsed.company_size_progression?.length,
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

// NEW: Generate intelligent search expansions (returns complete variants)
async function generateSearchExpansionVariants(
  originalQuery: string,
  initialFilters: ChronologicalFilters,
  initialResultCount?: number
): Promise<SearchExpansionVariant[]> {
  console.log(`[SEARCH EXPANSION] 🔍 Generating search expansion variants for: "${originalQuery}"`);
  console.log(`[SEARCH EXPANSION] 📊 Initial filters:`, initialFilters);
  console.log(`[SEARCH EXPANSION] 📈 Initial result count:`, initialResultCount);

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0.3, // Slightly higher for creative alternatives
    messages: [
      {
        role: 'system',
        content: `You are an intelligent search expansion system. Your job is to analyze an initial search query and its extracted filters, then generate 2-3 alternative filter sets that could capture different valid interpretations or relaxed versions of the original query.

**YOUR GOAL:**
Generate alternative search strategies that maintain the core intent while broadening the search space to find more relevant profiles. For each alternative filter set, also generate a natural language query that would produce those filters.

**EXPANSION STRATEGIES:**

1. **FILTER RELAXATION** - Make restrictive filters less strict:
   - Remove specific company/school requirements → focus on industry/field
   - Reduce experience minimums by 2-3 years
   - Broaden specific titles to related roles
   - Expand specific industries to related sectors

2. **SEMANTIC EXPANSION** - Use related terms and concepts:
   - "Engineering" → "Technical roles", "Software development", "Product development"
   - "Consulting" → "Advisory", "Client services", "Strategy"
   - "Finance" → "Banking", "Investment", "Financial services"
   - "Marketing" → "Brand management", "Communications", "Growth"

3. **ALTERNATIVE INTERPRETATIONS** - Find different valid readings:
   - "Georgetown graduates at Google" could also mean:
     - "Business school graduates in tech companies"
     - "People with strong academic backgrounds in technology"
   - "Experienced consultants" could expand to:
     - "People with client-facing experience"
     - "Strategic advisors and analysts"

4. **HIERARCHICAL RELAXATION** - Remove filters in order of specificity:
   - Most specific: Remove exact company/school names
   - Moderately specific: Broaden title/industry terms  
   - Least specific: Reduce experience requirements

**FILTER CATEGORIES TO CONSIDER:**

**Basic Filters (often too restrictive):**
- school_filter: Remove specific institution, focus on degree level
- company_filter: Remove specific company, focus on industry/size
- industry_filter: Expand to related industries
- title_filter: Broaden to related roles/functions
- location_filter: Expand to broader geographic areas

**Experience Filters (often need relaxation):**
- min_years_in_industry: Reduce by 2-3 years
- min_years_in_function: Reduce by 2-3 years  
- total_experience_years: Reduce by 2-3 years

**Pattern Filters (often need alternatives):**
- career_progression_pattern: Try related progression types
- industry_transitions: Expand to similar transition patterns

**EXAMPLES:**

**Original Query:** "Find Georgetown MBA graduates working at Google"
**Initial Filters:** {"school_filter": "Georgetown", "company_filter": "Google", "degree_level_progression": ["Bachelor's", "Master's"]}

**Expansion 1 - Remove Company Specificity:**
{
  "natural_language_query": "Georgetown MBA graduates working in technology companies",
  "filters": {
    "school_filter": "Georgetown",
    "industry_filter": "technology", 
    "degree_level_progression": ["Bachelor's", "Master's"]
  }
}

**Expansion 2 - Remove School Specificity:**
{
  "natural_language_query": "MBA graduates working at Google",
  "filters": {
    "company_filter": "Google",
    "degree_level_progression": ["Bachelor's", "Master's"]
  }
}

**Expansion 3 - Semantic Expansion:**
{
  "natural_language_query": "Business school graduates working at major tech companies",
  "filters": {
    "industry_filter": "technology",
    "degree_level_progression": ["Bachelor's", "Master's"],
    "company_size_progression": ["large"]
  }
}

**Original Query:** "People with 10+ years consulting experience who became executives"
**Initial Filters:** {"industry_filter": "consulting", "min_years_in_industry": 10, "career_progression_pattern": "individual_contributor_to_management"}

**Expansion 1 - Reduce Experience Requirement:**
{
  "natural_language_query": "People with 7+ years consulting experience who moved to leadership roles",
  "filters": {
    "industry_filter": "consulting",
    "min_years_in_industry": 7,
    "career_progression_pattern": "individual_contributor_to_management"
  }
}

**Expansion 2 - Broaden Industry:**
{
  "natural_language_query": "Experienced client-facing professionals who became executives",
  "filters": {
    "min_years_in_industry": 8,
    "career_progression_pattern": "individual_contributor_to_management",
    "title_filter": "client"
  }
}

**Expansion 3 - Alternative Progression Pattern:**
{
  "natural_language_query": "Experienced consultants who advanced to senior positions",
  "filters": {
    "industry_filter": "consulting", 
    "min_years_in_industry": 8,
    "career_progression_pattern": "entry_level_to_senior"
  }
}

**IMPORTANT RULES:**
1. **Always generate exactly 3 expansion variants**
2. **Each natural language query must be clear and searchable**
3. **The natural language query should naturally produce the corresponding filters**
4. **Maintain the core intent of the original query**
5. **Don't make filters MORE restrictive than the original**
6. **Ensure each variant is meaningfully different from the others**
7. **If original filters are already very broad, focus on semantic alternatives rather than relaxation**

**OUTPUT FORMAT:**
Return only valid JSON in this exact structure:

{
  "expansion_variants": [
    {
      "natural_language_query": "Clear, searchable natural language query",
      "filters": { /* ChronologicalFilters object */ }
    },
    {
      "natural_language_query": "Another clear, searchable natural language query", 
      "filters": { /* ChronologicalFilters object */ }
    },
    {
      "natural_language_query": "Third clear, searchable natural language query",
      "filters": { /* ChronologicalFilters object */ }
    }
  ]
}

Respond only with valid JSON.`
      },
      {
        role: 'user',
        content: `Original Query: "${originalQuery}"

Initial Filters: ${JSON.stringify(initialFilters, null, 2)}

${initialResultCount !== undefined ? `Initial Result Count: ${initialResultCount}` : ''}

Generate 3 intelligent search expansion variants that maintain the core intent while broadening the search space.`
      }
    ]
  });

  console.log(`[SEARCH EXPANSION] 🤖 OpenAI expansion response received`);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.log(`[SEARCH EXPANSION] ⚠️ Empty response from OpenAI, returning empty expansions`);
    return [];
  }

  try {
    const parsed = JSON.parse(content);
    console.log(`[SEARCH EXPANSION] ✅ Search expansion variants generated successfully:`, parsed);
    
    if (!parsed.expansion_variants || !Array.isArray(parsed.expansion_variants)) {
      console.error(`[SEARCH EXPANSION] ❌ Invalid response structure, expected expansion_variants array`);
      return [];
    }

    const variants = parsed.expansion_variants as SearchExpansionVariant[];
    console.log(`[SEARCH EXPANSION] 📊 Expansion summary:`, {
      totalVariants: variants.length,
      generatedQueries: variants.map(v => v.natural_language_query),
      hasFilters: variants.map(v => Object.keys(v.filters || {}).length > 0)
    });

    return variants;
  } catch (error) {
    console.error(`[SEARCH EXPANSION] ❌ Failed to parse expansion response:`, {
      error: error,
      rawContent: content
    });
    return [];
  }
}

// NEW: Generate intelligent search expansions (backward compatibility - returns only filters)
async function generateSearchExpansions(
  originalQuery: string,
  initialFilters: ChronologicalFilters,
  initialResultCount?: number
): Promise<ChronologicalFilters[]> {
  const variants = await generateSearchExpansionVariants(originalQuery, initialFilters, initialResultCount);
  return variants.map(variant => variant.filters);
}


async function translateStandardSearchQuery(
  query: string
): Promise<StandardSearchFilters> {
  console.log(`[PIPELINE STANDARD] 📊 Starting standard search translation for: "${query}"`);
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are translating natural language queries into structured filters for comprehensive standard alumni search.

**FOCUS: CURRENT STATE ATTRIBUTES ONLY**
- No progression patterns ("then became", "moved from X to Y")
- No timeline analysis or career advancement logic
- No experience depth requirements ("10+ years")
- Just semantic matching of current attributes with intelligent OR logic

**COMPREHENSIVE FILTER CATEGORIES:**

**1. BASIC ENTITY FILTERS (Single or Multiple with OR logic):**
- company_filter: string OR company_filters: string[] with company_or_logic: boolean
- industry_filter: string OR industry_filters: string[] with industry_or_logic: boolean  
- title_filter: string OR title_filters: string[] with title_or_logic: boolean
- location_filter: string OR location_filters: string[] with location_or_logic: boolean
- school_filter: string OR school_filters: string[] with school_or_logic: boolean

**2. CAREER PROGRESSION & LEADERSHIP FILTERS:**
- current_job_level_filter: string OR current_job_level_filters: string[] with current_job_level_or_logic: boolean
  Values: "Entry Level", "Mid Level", "Senior", "Executive", "C-Suite", "Director", "Manager", "Individual Contributor"
- current_job_function_filter: string OR current_job_function_filters: string[] with current_job_function_or_logic: boolean
  Values: "Engineering", "Sales", "Marketing", "Finance", "Operations", "HR", "Legal", "Consulting", "Product", "Design"
- career_stage_filter: string ("Early Career", "Mid Career", "Senior Career", "Executive")
- career_trajectory_filter: string OR career_trajectory_filters: string[] with career_trajectory_or_logic: boolean
  Values: "Fast Growth", "Steady Progression", "Industry Switcher", "Entrepreneur", "Corporate Climber"
- is_current_leader: boolean
- management_experience: boolean
- revenue_responsibility: boolean

**3. COMPANY & INDUSTRY INTELLIGENCE:**
- current_company_size_category_filter: string OR current_company_size_category_filters: string[] with current_company_size_category_or_logic: boolean
  Values: "Startup", "Small", "Medium", "Large", "Enterprise", "Fortune 500"
- has_startup_experience: boolean
- has_enterprise_experience: boolean
- industry_transitions_filter: string[] (for people who changed industries)

**4. SKILLS & EXPERIENCE PATTERNS:**
- technical_background: boolean
- sales_experience: boolean
- consulting_experience: boolean
- restaurant_operations_experience: boolean
- is_remote_worker: boolean
- functional_expertise_filter: string[] with functional_expertise_or_logic: boolean
  Values: ["product management", "engineering", "sales", "marketing", "finance", "operations", "consulting", "design", "data science"]
- industry_expertise_filter: string[] with industry_expertise_or_logic: boolean
  Values: ["technology", "finance", "healthcare", "retail", "consulting", "media", "manufacturing", "real estate"]

**5. EDUCATIONAL BACKGROUND & CONTEXT:**
- highest_degree_level_filter: string OR highest_degree_level_filters: string[] with highest_degree_level_or_logic: boolean
  Values: "High School", "Associate", "Bachelor's", "Master's", "PhD", "JD", "MD", "MBA"
- school_ranking_tier_filter: string OR school_ranking_tier_filters: string[] with school_ranking_tier_or_logic: boolean
  Values: "Ivy League", "Top 10", "Top 20", "Top 50", "Public Ivy", "Liberal Arts", "Technical", "International"
- major_category_filter: string OR major_category_filters: string[] with major_category_or_logic: boolean
  Values: "STEM", "Business", "Liberal Arts", "Engineering", "Computer Science", "Medicine", "Law", "Arts"
- undergraduate_major_filter: string OR undergraduate_major_filters: string[] with undergraduate_major_or_logic: boolean
- graduate_specialization_filter: string OR graduate_specialization_filters: string[] with graduate_specialization_or_logic: boolean
- stem_education: boolean
- business_education: boolean
- elite_education: boolean
- continued_education: boolean
- executive_education: boolean
- technical_certifications: boolean

**6. ENHANCED SEARCH CATEGORIES:**
- mentor_potential: boolean
- likely_job_seeking: boolean
- total_positions_min: number (minimum number of positions held)
- total_positions_max: number (maximum number of positions held)
- average_tenure_min_months: number (minimum average tenure)
- average_tenure_max_months: number (maximum average tenure)

**7. COMPANY IMPACT METRICS (Organization-specific):**
- company_provided_salary_lift: boolean
- achieved_six_figure_post_company: boolean
- doubled_salary_post_company: boolean
- moved_to_leadership_post_company: boolean
- career_level_increase_post_company: boolean

**8. GEOGRAPHIC & LOCATION:**
- home_location_filter: string OR home_location_filters: string[] with home_location_or_logic: boolean
- education_geography_filter: string[] with education_geography_or_logic: boolean
  Values: ["Domestic", "International", "East Coast", "West Coast", "Midwest", "South", "Europe", "Asia"]

**9. SALARY ANALYSIS FIELDS:**
- min_current_salary: number
- max_current_salary: number
- min_highest_career_salary: number
- max_highest_career_salary: number
- salary_growth_indicator: boolean (for people with significant salary increases)

**NEW: MATHEMATICAL SALARY COMPARISON FIELDS - ADVANCED DETECTION:**

**STEP 1: DETECT SALARY NUMBERS AND COMPARISONS**
- Extract ALL numbers from query (e.g., "100,000", "100k", "$75K", "six figures")
- Convert text numbers to numeric values:
  - "six figures" → 100000
  - "100k" → 100000  
  - "$75K" → 75000
  - "quarter million" → 250000
  - "half a million" → 500000

**STEP 2: DETECT COMPARISON OPERATIONS**
- "above", "over", "more than", "greater than", "exceeds" → Use min_* fields
- "below", "under", "less than", "lower than" → Use max_* fields  
- "between X and Y" → Use min_* and max_* fields
- "around", "approximately", "about" → Use ±10% range

**STEP 3: DETECT SALARY RELATIONSHIPS**
- "after [company] vs before [company]" → post_salary_greater_than_pre: true
- "doubled their salary" → min_salary_multiplier: 2.0
- "tripled their income" → min_salary_multiplier: 3.0
- "50% increase" → min_salary_growth_percentage: 50
- "salary grew by $20,000" → min_salary_increase_amount: 20000

**MATHEMATICAL SALARY FIELDS:**
- post_salary_greater_than_pre: boolean (salary after target company > before)
- current_salary_greater_than_first_post: boolean (continued salary growth)
- min_salary_growth_percentage: number (e.g., 25 for 25% increase)
- max_salary_growth_percentage: number (e.g., 100 for max 100% increase)
- min_salary_increase_amount: number (e.g., 20000 for $20k increase)
- min_salary_multiplier: number (e.g., 2.0 for "doubled", 1.5 for "50% increase")
- current_salary_near_peak: boolean (within 90% of career peak)
- salary_range_pre_company: [number, number] (salary range before target company)
- salary_range_post_company: [number, number] (salary range after target company)
- min_pre_chick_fil_a_salary: number (minimum salary before Chick-fil-A)
- min_first_post_chick_fil_a_salary: number (minimum first salary after Chick-fil-A)

**COMPREHENSIVE SALARY EXAMPLES:**

Query: "Find me alumni currently making above $100,000"
{
  "min_current_salary": 100000
}

Query: "Alumni whose job after Chick-fil-A pays more than their job before"
{
  "post_salary_greater_than_pre": true
}

Query: "People who doubled their salary after leaving"
{
  "min_salary_multiplier": 2.0,
  "post_salary_greater_than_pre": true
}

Query: "Alumni making between $75k and $150k currently"
{
  "min_current_salary": 75000,
  "max_current_salary": 150000
}

Query: "Find people whose salary increased by at least 50% after Chick-fil-A"
{
  "min_salary_growth_percentage": 50,
  "post_salary_greater_than_pre": true
}

Query: "Alumni who got at least a $25,000 raise after leaving"
{
  "min_salary_increase_amount": 25000,
  "post_salary_greater_than_pre": true
}

Query: "People making six figures who are near their career peak"
{
  "min_current_salary": 100000,
  "current_salary_near_peak": true
}

Query: "Alumni whose first job after Chick-fil-A paid over $80k"
{
  "min_first_post_chick_fil_a_salary": 80000
}

Query: "Find high earners who tripled their income"
{
  "min_salary_multiplier": 3.0,
  "min_current_salary": 150000
}

Query: "People who had modest salary growth (10-30%)"
{
  "min_salary_growth_percentage": 10,
  "max_salary_growth_percentage": 30,
  "post_salary_greater_than_pre": true
}

**10. ARRAY FIELDS FOR COMPREHENSIVE SEARCH (OR Logic) - CURRENT STATE ONLY:**
- post_company_companies_filter: string[] with post_company_companies_or_logic: boolean
- post_company_titles_filter: string[] with post_company_titles_or_logic: boolean
- post_company_industries_filter: string[] with post_company_industries_or_logic: boolean
- undergraduate_schools_filter: string[] with undergraduate_schools_or_logic: boolean
- graduate_schools_filter: string[] with graduate_schools_or_logic: boolean

**INTELLIGENT OR LOGIC EXAMPLES:**

Query: "Senior software engineers at tech companies"
{
  "current_job_level_filters": ["Senior", "Staff", "Principal", "Lead"],
  "current_job_level_or_logic": true,
  "title_filters": ["software engineer", "software developer", "SWE", "engineer"],
  "title_or_logic": true,
  "industry_filters": ["technology", "software", "internet", "tech"],
  "industry_or_logic": true,
  "technical_background": true
}

Query: "MBA graduates with consulting experience"
{
  "highest_degree_level_filter": "MBA",
  "consulting_experience": true,
  "functional_expertise_filter": ["consulting", "strategy", "advisory"],
  "functional_expertise_or_logic": true,
  "business_education": true
}

Query: "Startup founders and entrepreneurs"
{
  "title_filters": ["founder", "CEO", "co-founder", "entrepreneur", "chief executive"],
  "title_or_logic": true,
  "has_startup_experience": true,
  "is_current_leader": true,
  "career_trajectory_filter": "Entrepreneur"
}

Query: "High-earning tech executives"
{
  "min_current_salary": 200000,
  "current_job_level_filters": ["Executive", "C-Suite", "VP", "Director"],
  "current_job_level_or_logic": true,
  "industry_filters": ["technology", "software", "tech"],
  "industry_or_logic": true,
  "is_current_leader": true,
  "management_experience": true
}

Query: "Ivy League graduates in finance"
{
  "school_ranking_tier_filter": "Ivy League",
  "industry_filter": "finance",
  "elite_education": true,
  "industry_expertise_filter": ["finance", "banking", "investment"],
  "industry_expertise_or_logic": true
}

Query: "Remote workers with technical backgrounds"
{
  "is_remote_worker": true,
  "technical_background": true,
  "functional_expertise_filter": ["engineering", "software development", "data science", "product"],
  "functional_expertise_or_logic": true
}

Query: "People who achieved significant salary growth"
{
  "company_provided_salary_lift": true,
  "salary_growth_indicator": true,
  "achieved_six_figure_post_company": true,
  "min_highest_career_salary": 100000
}

Query: "International education backgrounds"
{
  "education_geography_filter": ["International", "Europe", "Asia"],
  "education_geography_or_logic": true,
  "continued_education": true
}

Query: "FAANG alumni in leadership roles"
{
  "post_company_companies_filter": ["Google", "Apple", "Facebook", "Meta", "Amazon", "Netflix"],
  "post_company_companies_or_logic": true,
  "is_current_leader": true,
  "management_experience": true,
  "technical_background": true
}

Query: "Data scientists and ML engineers"
{
  "title_filters": ["data scientist", "ML engineer", "machine learning engineer", "AI engineer", "data engineer"],
  "title_or_logic": true,
  "technical_background": true,
  "functional_expertise_filter": ["data science", "machine learning", "AI"],
  "functional_expertise_or_logic": true,
  "stem_education": true
}

**MAPPING GUIDELINES:**

**Abstract Concepts to Concrete Filters:**
- "Creative professionals" → industry_expertise: ["design", "media", "arts"], functional_expertise: ["creative", "design", "marketing"]
- "Tech leaders" → technical_background: true, is_current_leader: true, industry: "technology"
- "High performers" → salary_growth_indicator: true, moved_to_leadership_post_company: true
- "Well-connected" → mentor_potential: true, has_enterprise_experience: true

**Experience Level Mapping:**
- "Entry-level" → current_job_level: "Entry Level", career_stage: "Early Career"
- "Senior" → current_job_level_filters: ["Senior", "Staff", "Principal"], current_job_level_or_logic: true
- "Executive" → current_job_level_filters: ["Executive", "C-Suite", "VP"], is_current_leader: true

**Industry Expansion:**
- "Tech" → ["technology", "software", "internet", "computer", "AI", "fintech"]
- "Finance" → ["finance", "banking", "investment", "fintech", "insurance", "real estate"]
- "Healthcare" → ["healthcare", "medical", "pharmaceutical", "biotech", "medtech"]

**Company Size Mapping:**
- "Big tech" → current_company_size_category: "Enterprise", industry: "technology"
- "Startups" → current_company_size_category_filters: ["Startup", "Small"], has_startup_experience: true
- "Fortune 500" → current_company_size_category: "Fortune 500", has_enterprise_experience: true

**Salary Indicators:**
- "High earners" → min_current_salary: 150000, salary_growth_indicator: true
- "Six-figure" → min_current_salary: 100000, achieved_six_figure_post_company: true
- "Well-compensated" → min_highest_career_salary: 120000, company_provided_salary_lift: true

**EXTRACTION RULES:**
1. **Always prefer OR logic** for broader, more inclusive matching
2. **Use arrays for synonyms** and related terms
3. **Combine boolean flags** for implied characteristics
4. **Map salary mentions** to specific numeric ranges
5. **Extract education levels** and map to degree hierarchies
6. **Identify geographic patterns** and map to location arrays
7. **Recognize company impact** indicators and map to outcome metrics

**IMPORTANT: REMOVED FIELDS (DO NOT USE):**
- pre_company_* fields (these belong in chronological search)
- Timeline/progression fields (these belong in chronological/temporal search)
- Temporal analysis fields (these belong in temporal search)

Return comprehensive JSON with all applicable filters. Default OR logic to true when using multiple values.`
      },
      {
        role: 'user',
        content: `Query: "${query}"`
      }
    ]
  });

  console.log(`[PIPELINE STANDARD] 🤖 OpenAI standard translation response received`);

  const content = response.choices[0]?.message?.content;
  console.log(`[PIPELINE STANDARD] 🔍 RAW LLM RESPONSE:`, {
    hasContent: !!content,
    contentLength: content?.length || 0,
    rawContent: content
  });

  if (!content) {
    console.log(`[PIPELINE STANDARD] ⚠️ Empty response from OpenAI, returning default filters`);
    return {};
  }

  try {
    const parsed = JSON.parse(content);
    
    console.log(`[PIPELINE STANDARD] 🔍 PARSED STANDARD FILTERS:`, {
      parsedSuccessfully: true,
      parsedKeys: Object.keys(parsed),
      parsedValues: parsed,
      hasBasicFilters: {
        company_filter: !!parsed.company_filter,
        company_filters: !!parsed.company_filters,
        industry_filter: !!parsed.industry_filter,
        industry_filters: !!parsed.industry_filters,
        title_filter: !!parsed.title_filter,
        title_filters: !!parsed.title_filters
      },
      hasCareerFilters: {
        current_job_level_filter: !!parsed.current_job_level_filter,
        current_job_function_filter: !!parsed.current_job_function_filter,
        career_stage_filter: !!parsed.career_stage_filter,
        is_current_leader: !!parsed.is_current_leader,
        management_experience: !!parsed.management_experience
      },
      hasEducationFilters: {
        highest_degree_level_filter: !!parsed.highest_degree_level_filter,
        school_ranking_tier_filter: !!parsed.school_ranking_tier_filter,
        major_category_filter: !!parsed.major_category_filter,
        stem_education: !!parsed.stem_education,
        elite_education: !!parsed.elite_education
      },
      hasSalaryFilters: {
        min_current_salary: !!parsed.min_current_salary,
        salary_growth_indicator: !!parsed.salary_growth_indicator,
        company_provided_salary_lift: !!parsed.company_provided_salary_lift
      },
      hasArrayFilters: {
        functional_expertise_filter: !!parsed.functional_expertise_filter,
        industry_expertise_filter: !!parsed.industry_expertise_filter,
        post_company_companies_filter: !!parsed.post_company_companies_filter
      }
    });
    
    console.log(`[PIPELINE STANDARD] ✅ Standard filters extracted successfully:`, parsed);
    return parsed;
  } catch (error) {
    console.error(`[PIPELINE STANDARD] ❌ Failed to parse standard translation response:`, {
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      rawContent: content
    });
    return {};
  }
}

// Interface for Standard Search Filters - UPDATED TO REMOVE CHRONOLOGICAL/TEMPORAL FIELDS
interface StandardSearchFilters {
  // 1. BASIC ENTITY FILTERS (single or multiple with OR logic)
  company_filter?: string;
  company_filters?: string[];
  company_or_logic?: boolean;
  
  industry_filter?: string;
  industry_filters?: string[];
  industry_or_logic?: boolean;
  
  title_filter?: string;
  title_filters?: string[];
  title_or_logic?: boolean;
  
  location_filter?: string;
  location_filters?: string[];
  location_or_logic?: boolean;
  
  school_filter?: string;
  school_filters?: string[];
  school_or_logic?: boolean;
  
  // 2. CAREER PROGRESSION & LEADERSHIP FILTERS
  current_job_level_filter?: string;
  current_job_level_filters?: string[];
  current_job_level_or_logic?: boolean;
  
  current_job_function_filter?: string;
  current_job_function_filters?: string[];
  current_job_function_or_logic?: boolean;
  
  career_stage_filter?: string;
  career_trajectory_filter?: string;
  career_trajectory_filters?: string[];
  career_trajectory_or_logic?: boolean;
  
  is_current_leader?: boolean;
  management_experience?: boolean;
  revenue_responsibility?: boolean;
  
  // 3. COMPANY & INDUSTRY INTELLIGENCE
  current_company_size_category_filter?: string;
  current_company_size_category_filters?: string[];
  current_company_size_category_or_logic?: boolean;
  
  has_startup_experience?: boolean;
  has_enterprise_experience?: boolean;
  industry_transitions_filter?: string[];
  
  // 4. SKILLS & EXPERIENCE PATTERNS
  technical_background?: boolean;
  sales_experience?: boolean;
  consulting_experience?: boolean;
  restaurant_operations_experience?: boolean;
  is_remote_worker?: boolean;
  
  functional_expertise_filter?: string[];
  functional_expertise_or_logic?: boolean;
  
  industry_expertise_filter?: string[];
  industry_expertise_or_logic?: boolean;
  
  // 5. EDUCATIONAL BACKGROUND & CONTEXT
  highest_degree_level_filter?: string;
  highest_degree_level_filters?: string[];
  highest_degree_level_or_logic?: boolean;
  
  school_ranking_tier_filter?: string;
  school_ranking_tier_filters?: string[];
  school_ranking_tier_or_logic?: boolean;
  
  major_category_filter?: string;
  major_category_filters?: string[];
  major_category_or_logic?: boolean;
  
  undergraduate_major_filter?: string;
  undergraduate_major_filters?: string[];
  undergraduate_major_or_logic?: boolean;
  
  graduate_specialization_filter?: string;
  graduate_specialization_filters?: string[];
  graduate_specialization_or_logic?: boolean;
  
  stem_education?: boolean;
  business_education?: boolean;
  elite_education?: boolean;
  continued_education?: boolean;
  executive_education?: boolean;
  technical_certifications?: boolean;
  
  // 6. ENHANCED SEARCH CATEGORIES
  mentor_potential?: boolean;
  likely_job_seeking?: boolean;
  total_positions_min?: number;
  total_positions_max?: number;
  average_tenure_min_months?: number;
  average_tenure_max_months?: number;
  
  // 7. COMPANY IMPACT METRICS (Organization-specific)
  company_provided_salary_lift?: boolean;
  achieved_six_figure_post_company?: boolean;
  doubled_salary_post_company?: boolean;
  moved_to_leadership_post_company?: boolean;
  career_level_increase_post_company?: boolean;
  
  // 8. GEOGRAPHIC & LOCATION
  home_location_filter?: string;
  home_location_filters?: string[];
  home_location_or_logic?: boolean;
  
  education_geography_filter?: string[];
  education_geography_or_logic?: boolean;
  
  // 9. SALARY ANALYSIS FIELDS
  min_current_salary?: number;
  max_current_salary?: number;
  min_highest_career_salary?: number;
  max_highest_career_salary?: number;
  salary_growth_indicator?: boolean;
  
  // NEW: MATHEMATICAL SALARY COMPARISON FIELDS
  // Dynamic salary comparisons
  post_salary_greater_than_pre?: boolean;
  current_salary_greater_than_first_post?: boolean;
  
  // Percentage-based growth
  min_salary_growth_percentage?: number; // e.g., 25 for 25% increase
  max_salary_growth_percentage?: number; // e.g., 100 for max 100% increase
  
  // Absolute dollar amount increases
  min_salary_increase_amount?: number; // e.g., 20000 for $20k increase
  
  // Salary multipliers
  min_salary_multiplier?: number; // e.g., 2.0 for "doubled", 1.5 for "50% increase"
  
  // Career peak comparisons
  current_salary_near_peak?: boolean; // Within 90% of career peak
  
  // Salary range comparisons (arrays: [min, max])
  salary_range_pre_company?: [number, number]; // [min, max] for pre-company salary
  salary_range_post_company?: [number, number]; // [min, max] for post-company salary
  
  // Specific company salary fields
  min_pre_chick_fil_a_salary?: number;
  min_first_post_chick_fil_a_salary?: number;
  
  // 10. COMPREHENSIVE ARRAY FIELDS FOR CAREER TRACKING (PRE + POST COMPANY):**
  // PRE-COMPANY FIELDS (Background/Network Analysis)
  pre_company_companies_filter?: string[];
  pre_company_companies_or_logic?: boolean;
  
  pre_company_titles_filter?: string[];
  pre_company_titles_or_logic?: boolean;
  
  pre_company_industries_filter?: string[];
  pre_company_industries_or_logic?: boolean;
  
  pre_company_locations_filter?: string[];
  pre_company_locations_or_logic?: boolean;
  
  // POST-COMPANY FIELDS (Current/Recent Career Path)
  post_company_companies_filter?: string[];
  post_company_companies_or_logic?: boolean;
  
  post_company_titles_filter?: string[];
  post_company_titles_or_logic?: boolean;
  
  post_company_industries_filter?: string[];
  post_company_industries_or_logic?: boolean;
  
  post_company_locations_filter?: string[];
  post_company_locations_or_logic?: boolean;
  
  // EDUCATION FIELDS
  undergraduate_schools_filter?: string[];
  undergraduate_schools_or_logic?: boolean;
  
  graduate_schools_filter?: string[];
  graduate_schools_or_logic?: boolean;
} 