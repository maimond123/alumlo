import { NextRequest, NextResponse } from 'next/server';

// Add debugging around the import
console.log('[API] 🚀 Starting to import LinkedInProfileSearchEngine...');
try {
  var { LinkedInProfileSearchEngine } = require('../../data/ai_search');
  console.log('[API] ✅ Successfully imported LinkedInProfileSearchEngine');
} catch (importError: unknown) {
  console.error('[API] ❌ FAILED TO IMPORT LinkedInProfileSearchEngine:', {
    error: importError,
    message: importError instanceof Error ? importError.message : 'Unknown import error',
    stack: importError instanceof Error ? importError.stack : 'No stack'
  });
  throw importError;
}

// Test function to check if we can load the transformers library
const testTransformersLoad = async () => {
  try {
    console.log('[API] Attempting to load transformers library');
    if (typeof window !== 'undefined') {
      console.log('[API] Loading browser version of transformers');
      return await import('@xenova/transformers/dist/transformers.min.js');
    } else {
      console.log('[API] Loading Node.js version of transformers');
      return await import('@xenova/transformers');
    }
  } catch (error: unknown) {
    console.error('[API] Failed to load transformers library:', error);
    throw error;
  }
};

export async function POST(req: NextRequest) {
  console.log('[API] 🏁 POST function called - starting execution...');
  
  try {
    console.log('[API] Route handler started');
    
    // Add debugging for environment variables
    console.log('[API] 🔑 Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      nodeEnv: process.env.NODE_ENV
    });
    
    // Try to parse the request body
    const body = await req.json();
    console.log('[API] Request body parsed:', body);
    
    const { 
      query, 
      top_k = 10, 
      filters = {}, 
      organizationName, 
      isDemo = false,
      queryClassification,
      chronologicalWeights
    } = body;
    
    if (!query || typeof query !== 'string') {
      console.log('[API] Invalid query parameter');
      return NextResponse.json({ 
        results: [],
        error: 'Invalid query parameter' 
      }, { status: 400 });
    }

    console.log(`[API DEBUG] Received parameters:`, {
      query,
      organizationName,
      isDemo,
      hasClassification: !!queryClassification,
      classificationType: queryClassification?.type,
      hasFilters: Object.keys(filters).length > 0,
      filterKeys: Object.keys(filters),
      hasChronologicalWeights: !!chronologicalWeights,
      chronologicalWeights
    });
    
    console.log(`[API DEBUG] Using gap-based filtering instead of fixed top_k=${top_k}`);

    // Try each step separately to identify where the error occurs
    console.log('[API] Creating search engine instance');
    const search_engine = new LinkedInProfileSearchEngine();
    
    console.log('[API] Initializing embedder');
    await search_engine.initializeEmbedder().catch((error: unknown) => {
      console.error('[API] Error initializing embedder:', error);
      throw new Error(`Embedder initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    });
    
    console.log(`[API] Executing search with query: "${query}", isDemo: ${isDemo}`);
    console.log(`[API DEBUG] Organization context: "${organizationName}"`);
    
    // Route to appropriate search method based on query classification
    let results;
    let searchType = 'standard';
    let searchMetadata: any = {};
    
    if (!isDemo && organizationName && queryClassification?.type) {
      
      // 1. TEMPORAL SEARCH - For date-specific timeline queries
      if (queryClassification.type === 'temporal' && queryClassification.temporal_elements) {
        console.log(`[API DEBUG] 🕐 TEMPORAL search detected for ${organizationName}`);
        console.log(`[API DEBUG] 🕐 Temporal elements:`, queryClassification.temporal_elements);
        
        try {
          results = await search_engine.searchTemporal(
            query,
            queryClassification.temporal_elements,
            50, // Use higher limit for gap-based filtering
            organizationName
          );
          
          if (results.length > 0) {
            console.log(`[API DEBUG] 🕐 Temporal search returned ${results.length} results`);
            searchType = 'temporal';
            searchMetadata = { temporal_elements: queryClassification.temporal_elements };
          } else {
            console.log(`[API DEBUG] 🕐 Temporal search returned no results, falling back to standard search`);
            results = null; // Will fall through to standard search
          }
        } catch (error: unknown) {
          console.log(`[API DEBUG] 🕐 Temporal search failed, falling back to standard search:`, error);
          results = null; // Will fall through to standard search
        }
      }
      
      // 2. CHRONOLOGICAL SEARCH - For career progression pattern queries (always uses LLM weights)
      else if (queryClassification.type === 'chronological' && queryClassification.progression_elements) {
        console.log(`[API DEBUG] 📈 CHRONOLOGICAL search detected for ${organizationName}`);
        console.log(`[API DEBUG] 📈 Progression elements:`, queryClassification.progression_elements);
        
        try {
          // Always assign chronological weights for chronological queries
          let chronologicalWeights = null;
          try {
            const weightResponse = await fetch('/api/assign-weights', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query })
            });
            if (weightResponse.ok) {
              chronologicalWeights = await weightResponse.json();
              console.log(`[API DEBUG] 📈 Assigned chronological weights:`, chronologicalWeights);
            }
          } catch (weightError) {
            console.log(`[API DEBUG] 📈 Weight assignment failed, using defaults:`, weightError);
          }
          
          // Translate natural language to chronological filters using new API
          let translatedFilters = {};
          try {
            const translateResponse = await fetch('/api/translate-chronological', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query })
            });
            if (translateResponse.ok) {
              translatedFilters = await translateResponse.json();
              console.log(`[API DEBUG] 📈 Translated chronological filters:`, translatedFilters);
            }
          } catch (translateError) {
            console.log(`[API DEBUG] 📈 Filter translation failed, using basic filters:`, translateError);
            translatedFilters = { gap_tolerance: 6 };
          }
          
          // Combine progression elements with translated filters and existing filters
          const chronologicalFilters = {
            ...translatedFilters,
            ...filters, // Include any existing filters from dashboard
          };
          
          // Add weights to filters
          if (chronologicalWeights) {
            chronologicalFilters.chronological_weights = chronologicalWeights;
          }
          
          console.log(`[API DEBUG] 📈 Final chronological filters:`, chronologicalFilters);
          
          results = await search_engine.searchChronological(
            query,
            chronologicalFilters,
            50,
            organizationName
          );
          
          if (results.length > 0) {
            console.log(`[API DEBUG] 📈 Chronological search returned ${results.length} results`);
            searchType = 'chronological';
            searchMetadata = { 
              progression_elements: queryClassification.progression_elements,
              translated_filters: translatedFilters,
              chronological_filters: chronologicalFilters,
              chronological_weights: chronologicalWeights
            };
          } else {
            console.log(`[API DEBUG] 📈 Chronological search returned no results, falling back to standard search`);
            results = null; // Will fall through to standard search
          }
        } catch (error: unknown) {
          console.log(`[API DEBUG] 📈 Chronological search failed, falling back to standard search:`, error);
          results = null; // Will fall through to standard search
        }
      }
    }
    
    // 3. STANDARD SEARCH - For basic semantic queries OR fallback
    if (!results) {
      console.log(`[API DEBUG] 📊 Using STANDARD search with enhanced filters`);
      
      // Auth-based routing: Any authenticated user with organizationName gets company search
      if (!isDemo && organizationName) {
        console.log(`[API DEBUG] ✅ Authenticated user detected with organization: "${organizationName}"`);
      } else {
        console.log(`[API DEBUG] ℹ️ Using demo search - isDemo: ${isDemo}, organizationName: "${organizationName}"`);
      }
      
      // Use the filters directly (they already contain the advanced filters from the dashboard)
      console.log(`[API DEBUG] Filters for company search:`, filters);
      
      console.log(`[API DEBUG] 🚀 About to call search_engine.searchCompany with:`, {
        query,
        limit: 50,
        filters,
        organizationName,
        chronologicalWeights,
        searchEngineType: typeof search_engine,
        hasSearchCompanyMethod: typeof search_engine.searchCompany === 'function'
      });
      
      // For standard search, only apply chronological weights if explicitly provided from dashboard
      const enhancedFilters = chronologicalWeights ? 
        { ...filters, chronological_weights: chronologicalWeights } : 
        filters;
      
      console.log(`[API DEBUG] Enhanced filters with weights:`, enhancedFilters);
      
      // Use gap-based filtering instead of fixed limit, always use company search for enhanced capabilities
      results = await search_engine.searchCompany(query, 50, enhancedFilters, organizationName);
    }
    
    console.log(`[API DEBUG] 📊 Final search results:`, {
      resultCount: results?.length || 0,
      resultsType: typeof results,
      isArray: Array.isArray(results),
      firstResult: results?.[0] ? {
        id: results[0].id,
        name: results[0].name,
        similarity: results[0].similarity
      } : null,
      searchType,
      usedMetadata: Object.keys(searchMetadata).length > 0
    });
    
    console.log('[API] Search completed successfully, found', results.length, 'results');
    
    return NextResponse.json({ 
      results,
      searchType,
      appliedFilters: filters,
      searchMetadata,
      filterCount: Object.keys(filters).length
    });
  } catch (error: unknown) {
    console.error('[API] Error in search:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Unknown error';
    let errorStack = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack || '';
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    }
    
    return NextResponse.json({ 
      results: [],
      error: 'Search failed', 
      details: errorMessage,
      stack: errorStack
    }, { status: 200 }); // Using 200 to ensure client gets the response
  }
}