import { NextRequest, NextResponse } from 'next/server';
import { LinkedInProfileSearchEngine } from '../../data/ai_search';

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
  } catch (error) {
    console.error('[API] Failed to load transformers library:', error);
    throw error;
  }
};

export async function POST(req: NextRequest) {
  try {
    console.log('[API] Route handler started');
    
    // Try to parse the request body
    const body = await req.json();
    console.log('[API] Request body parsed:', body);
    
    const { 
      query, 
      top_k = 10, 
      filters = {}, 
      organizationName, 
      isDemo = false,
      queryClassification
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
      filterKeys: Object.keys(filters)
    });
    
    console.log(`[API DEBUG] Using gap-based filtering instead of fixed top_k=${top_k}`);

    // Try each step separately to identify where the error occurs
    console.log('[API] Creating search engine instance');
    const search_engine = new LinkedInProfileSearchEngine();
    
    console.log('[API] Initializing embedder');
    await search_engine.initializeEmbedder().catch(error => {
      console.error('[API] Error initializing embedder:', error);
      throw new Error(`Embedder initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    });
    
    console.log(`[API] Executing search with query: "${query}", isDemo: ${isDemo}`);
    console.log(`[API DEBUG] Organization context: "${organizationName}"`);
    
    // Check for temporal search first (for non-demo users only)
    if (!isDemo && 
        queryClassification?.type === 'temporal' && 
        queryClassification?.temporal_elements && 
        organizationName) {
      
      console.log(`[API DEBUG] 🕐 Temporal search detected for ${organizationName}`);
      console.log(`[API DEBUG] 🕐 Temporal elements:`, queryClassification.temporal_elements);
      
      try {
        const temporalResults = await search_engine.searchTemporal(
          query,
          queryClassification.temporal_elements,
          50, // Use higher limit for gap-based filtering
          organizationName
        );
        
        if (temporalResults.length > 0) {
          console.log(`[API DEBUG] 🕐 Temporal search returned ${temporalResults.length} results`);
          return NextResponse.json({ 
            results: temporalResults,
            searchType: 'temporal',
            temporal_elements: queryClassification.temporal_elements
          });
        } else {
          console.log(`[API DEBUG] 🕐 Temporal search returned no results, falling back to standard search`);
        }
      } catch (error) {
        console.log(`[API DEBUG] 🕐 Temporal search failed, falling back to standard search:`, error);
      }
    }
    
    // Standard search with enhanced filters
    console.log(`[API DEBUG] 📊 Using standard search with enhanced filters`);
    
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
      searchEngineType: typeof search_engine,
      hasSearchCompanyMethod: typeof search_engine.searchCompany === 'function'
    });
    
    // Use gap-based filtering instead of fixed limit, always use company search for enhanced capabilities
    const results = await search_engine.searchCompany(query, 50, filters, organizationName);
    
    console.log(`[API DEBUG] 📊 searchCompany returned:`, {
      resultCount: results?.length || 0,
      resultsType: typeof results,
      isArray: Array.isArray(results),
      firstResult: results?.[0] ? {
        id: results[0].id,
        name: results[0].name,
        similarity: results[0].similarity
      } : null
    });
    
    console.log('[API] Search completed successfully, found', results.length, 'results');
    
    return NextResponse.json({ 
      results,
      searchType: 'standard',
      appliedFilters: filters,
      filterCount: Object.keys(filters).length
    });
  } catch (error) {
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