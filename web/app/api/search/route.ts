import { NextRequest, NextResponse } from 'next/server';

import { searchProfiles } from '../../data/search';

// Add timeout handling at the top
const SEARCH_TIMEOUT_MS = 60000; // 60 seconds (Increased from 30)

// Create timeout wrapper function
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = SEARCH_TIMEOUT_MS): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
};

// NEW: Debug collector for production debugging
class DebugCollector {
  private logs: string[] = [];
  private enabled: boolean = false;

  constructor(enabled: boolean = false) {
    this.enabled = enabled;
  }

  log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = data 
      ? `[${timestamp}] ${message}: ${JSON.stringify(data, null, 2)}`
      : `[${timestamp}] ${message}`;
    
    console.log(logEntry); // Still log to console
    
    if (this.enabled) {
      this.logs.push(logEntry);
    }
  }

  error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    const errorEntry = `[${timestamp}] ERROR ${message}: ${
      error instanceof Error ? error.message + '\n' + error.stack : JSON.stringify(error, null, 2)
    }`;
    
    console.error(errorEntry); // Still log to console
    
    if (this.enabled) {
      this.logs.push(errorEntry);
    }
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}

export async function POST(req: NextRequest) {
  // Enable debug mode for production testing
  const debug = new DebugCollector(true);
  
  debug.log('[API] 🏁 POST function called - starting execution...');
  debug.log(`[API SEARCH] 🚀 Search API started at ${new Date().toISOString()}`);
  
  try {
    debug.log('[API] Route handler started');
    
    // Add debugging for environment variables
    debug.log('[API] 🔑 Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      nodeEnv: process.env.NODE_ENV
    });
    
    // Try to parse the request body with timeout
    const body = await withTimeout(req.json(), 5000);
    debug.log('[API] Request body parsed:', body);
    debug.log(`[API SEARCH] 📝 Request body received:`, {
      hasQuery: !!body.query,
      queryLength: body.query?.length || 0,
      organizationName: body.organizationName,
      isDemo: body.isDemo,
      hasClassification: !!body.queryClassification,
      hasSearchConfig: !!body.searchConfig,
      hasFilters: !!body.filters && Object.keys(body.filters).length > 0
    });
    
    const { 
      query, 
      top_k = 10, 
      filters = {}, 
      organizationName, 
      isDemo = false,
      queryClassification,
      useChronologicalConfig = false,
      chronologicalConfig,
      searchConfig // New: pipeline search config
    } = body;
    
    const effectiveFilters = searchConfig?.enhancedFilters || filters;
    
    if (!query || typeof query !== 'string') {
      debug.log('[API] Invalid query parameter');
      debug.log(`[API SEARCH] ❌ Invalid query parameter`);
      return NextResponse.json({ 
        results: [],
        error: 'Invalid query parameter',
        debug: debug.getLogs()
      }, { status: 400 });
    }

    debug.log(`[API DEBUG] Received parameters:`, {
      query,
      organizationName,
      isDemo,
      hasClassification: !!queryClassification,
      classificationType: queryClassification?.type,
      hasFilters: Object.keys(effectiveFilters).length > 0,
      filterKeys: Object.keys(effectiveFilters),
      useChronologicalConfig,
      hasChronologicalConfig: !!chronologicalConfig,
      hasSearchConfig: !!searchConfig,
      pipelineEnhancedFilters: searchConfig?.enhancedFilters ? Object.keys(searchConfig.enhancedFilters) : null
    });
    debug.log(`[API SEARCH] 📊 Parameter analysis:`, {
      searchType: queryClassification?.type || 'unknown',
      configSource: searchConfig ? 'pipeline' : 'legacy',
      filterCount: Object.keys(effectiveFilters).length,
      isAuthenticated: !isDemo && !!organizationName,
      usingPipelineFilters: !!searchConfig?.enhancedFilters
    });
    

    // Try each step separately to identify where the error occurs
    debug.log(`[API] Executing search with query: "${query}", isDemo: ${isDemo}`);
    debug.log(`[API DEBUG] Organization context: "${organizationName}"`);
    debug.log(`[API SEARCH] 🎯 Starting search execution`);
    
    // Route to appropriate search method
    let results: any[] = [];
    let searchType = 'standard';
    let searchMetadata: any = {};
    
    // NEW: Check for unified pipeline configuration
    if (searchConfig) {
      debug.log(`[API SEARCH] 🔗 Processing unified pipeline configuration`);
      debug.log(`[API SEARCH] 📋 Pipeline config type: ${searchConfig.type}`);
      
      if (searchConfig.type === 'temporal' && searchConfig.temporalElements) {
        debug.log(`[API SEARCH] 🕐 Executing temporal search from pipeline`);
        debug.log(`[API SEARCH] 🕐 DETAILED: Temporal search configuration:`, {
          temporalElements: searchConfig.temporalElements,
          sqlFunction: searchConfig.sqlFunction,
          organizationName: organizationName
        });
        
        try {
          debug.log(`[API SEARCH] 🕐 DETAILED: Calling searchTemporal with parameters:`, {
            query: `"${query}"`,
            temporalElementsKeys: Object.keys(searchConfig.temporalElements),
            limit: 50,
            organizationName: organizationName
          });
          
          results = await withTimeout(
            searchProfiles({
              tenantSlug: organizationName,
              filters: searchConfig.temporalElements,
              query,
              limit: 50,
            }),
            SEARCH_TIMEOUT_MS
          );
          
          debug.log(`[API SEARCH] 🕐 DETAILED: Temporal search completed:`, {
            resultCount: Array.isArray(results) ? results.length : 0,
            hasResults: !!results && Array.isArray(results),
            isArray: Array.isArray(results),
            firstResultId: Array.isArray(results) && results.length > 0 ? results[0]?.id : 'none'
          });
          
          debug.log(`[API SEARCH] ✅ Temporal search completed with ${Array.isArray(results) ? results.length : 0} results`);
          searchType = 'temporal';
          searchMetadata = {
            search_method: 'temporal_pipeline',
            temporal_elements: searchConfig.temporalElements,
            sql_function: searchConfig.sqlFunction,
            configuration_source: 'pipeline'
          };
          
        } catch (error) {
          debug.error(`[API SEARCH] ❌ DETAILED: Temporal search from pipeline failed:`, {
            error: error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : 'No stack',
            errorName: error instanceof Error ? error.name : 'Unknown',
            searchConfig: searchConfig,
            organizationName: organizationName
          });
          
          // Log but don't throw - let it fall through to fallback
          debug.log(`[API SEARCH] 🔄 Temporal search failed, will try fallback methods`);
          results = [];
        }
      }
      
      else if (searchConfig.type === 'chronological' && searchConfig.filters) {
        debug.log(`[API SEARCH] 📈 Executing chronological search from pipeline`);
        debug.log(`[API SEARCH] 📈 DETAILED: Chronological search configuration:`, {
          filters: searchConfig.filters,
          sqlFunction: searchConfig.sqlFunction,
          organizationName: organizationName
        });
        
        debug.log(`[API SEARCH] 🔍 ENHANCED FUZZY MATCHING: This search is using the enhanced fuzzy matching system`);
        debug.log(`[API SEARCH] 🧠 FUZZY MATCHING FLOW: Query → Term Standardization → Filter Extraction → SQL Execution`);
        
        try {
          debug.log(`[API SEARCH] 📈 DETAILED: Calling searchChronological with parameters:`, {
            query: `"${query}"`,
            filtersCount: Object.keys(searchConfig.filters).length,
            limit: 50,
            organizationName: organizationName
          });
          
          // 🔍 DETAILED FILTER LOGGING FOR DEBUGGING - CHRONOLOGICAL
          debug.log(`[API SEARCH] 🔍 EXACT CHRONOLOGICAL FILTERS BEING SENT TO SQL:`, JSON.stringify(searchConfig.filters, null, 2));
          debug.log(`[API SEARCH] 🔍 CHRONOLOGICAL SQL FUNCTION CALL: ${searchConfig.sqlFunction}(chronological_filters: ${JSON.stringify(searchConfig.filters)}, limit_count: 50)`);
          debug.log(`[API SEARCH] 🎯 FUZZY MATCHING BENEFITS: These filters were enhanced through fuzzy term matching for better database compatibility`);
          
          // Execute primary search only (expansion will be handled separately)
          results = await withTimeout(
            searchProfiles({
              tenantSlug: organizationName,
              filters: searchConfig.filters,
              query,
              limit: 50,
            }),
            SEARCH_TIMEOUT_MS
          );
          
          debug.log(`[API SEARCH] 📈 DETAILED: Primary chronological search completed:`, {
            resultCount: Array.isArray(results) ? results.length : 0,
            hasResults: !!results && Array.isArray(results),
            isArray: Array.isArray(results),
            firstResultId: Array.isArray(results) && results.length > 0 ? results[0]?.id : 'none',
            sqlFunction: searchConfig.sqlFunction,
            filtersUsed: Object.keys(searchConfig.filters || {}),
            queryUsed: query,
            enhancedWithFuzzyMatching: true
          });
          
          // Set metadata for primary search only
          searchMetadata = {
            search_method: 'chronological_pipeline_primary',
            filters: searchConfig.filters,
            sql_function: searchConfig.sqlFunction,
            configuration_source: 'pipeline',
            strict_filtering: true,
            fuzzy_matching_enabled: true,
            term_standardization_applied: true,
            expansion_available: !!(body.expansionResults && body.expansionResults.variants && body.expansionResults.variants.length > 0)
          };
          
          debug.log(`[API SEARCH] ✅ Primary chronological search completed with ${Array.isArray(results) ? results.length : 0} results`);
          debug.log(`[API SEARCH] 🎉 FUZZY MATCHING SUCCESS: Enhanced search with intelligent term standardization completed`);
          searchType = 'chronological';
          
        } catch (error) {
          debug.error(`[API SEARCH] ❌ DETAILED: Chronological search from pipeline failed:`, {
            error: error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : 'No stack',
            errorName: error instanceof Error ? error.name : 'Unknown',
            searchConfig: searchConfig,
            organizationName: organizationName,
            fuzzyMatchingWasApplied: true
          });
          
          // Log but don't throw - let it fall through to fallback
          debug.log(`[API SEARCH] 🔄 Chronological search failed, will try fallback methods`);
          results = [];
        }
      }
      
      else if ( searchConfig.type === 'standard') {
        debug.log(`[API SEARCH] 📊 Standard search requested from pipeline`);
        debug.log(`[API SEARCH] 📋 DETAILED: Standard search configuration:`, {
          rpcFunction: `standard_search_function_${organizationName}`,
          hasFilters: !!searchConfig.enhancedFilters,
          filterKeys: Object.keys(searchConfig.enhancedFilters || {}),
          filterValues: searchConfig.enhancedFilters,
          filterCount: Object.keys(searchConfig.enhancedFilters || {}).length,
          isEmptyFilters: Object.keys(searchConfig.enhancedFilters || {}).length === 0
        });
        
        // 🔍 DETAILED FILTER LOGGING FOR DEBUGGING
        debug.log(`[API SEARCH] 🔍 EXACT FILTERS BEING SENT TO SQL:`, searchConfig.enhancedFilters);
        debug.log(`[API SEARCH] 🔍 SQL FUNCTION CALL: standard_search_function_${organizationName}(search_filters: ${JSON.stringify(searchConfig.enhancedFilters)}, limit_count: ${top_k})`);
        
        // Call the standardSearch with the enhanced filters
        const startTime = performance.now();
        debug.log(`[API SEARCH] ⏱️  Starting standard search execution with a ${SEARCH_TIMEOUT_MS / 1000}s timeout.`);

        try {
        results = await withTimeout(
          searchProfiles({
            tenantSlug: organizationName,
            filters: searchConfig.enhancedFilters,
            query,
            limit: top_k,
          }),
          SEARCH_TIMEOUT_MS
        );
          const endTime = performance.now();
          debug.log(`[API SEARCH] ✅ Standard search call finished in ${(endTime - startTime).toFixed(2)}ms.`);
        } catch (error) {
          const endTime = performance.now();
          debug.error(`[API SEARCH] ❌ Standard search failed after ${(endTime - startTime).toFixed(2)}ms.`, error);
          if (error instanceof Error && error.message.includes('timed out')) {
            debug.log(`[API SEARCH] ⏰ TIMEOUT CONFIRMED. The operation took longer than ${SEARCH_TIMEOUT_MS / 1000}s.`);
          }
          // Let fallback logic handle the failure
          results = [];
        }
        
        debug.log(`[API SEARCH] 🔍 DETAILED: Standard search completed:`, {
          resultCount: Array.isArray(results) ? results.length : 0,
          hasResults: !!results && Array.isArray(results),
          isArray: Array.isArray(results),
          firstResultId: Array.isArray(results) && results.length > 0 ? results[0]?.id : 'none',
          sqlFunction: `standard_search_function_${organizationName}`,
          filtersUsed: Object.keys(searchConfig.enhancedFilters || {}),
          queryUsed: query
        });
        
        debug.log(`[API SEARCH] ✅ Comprehensive SQL filtering completed: ${Array.isArray(results) ? results.length : 0} results`);
        
        searchMetadata = {
          search_method: 'standard_search_function',
          enhanced_filters: searchConfig.enhancedFilters,
          filter_count: Object.keys(searchConfig.enhancedFilters || {}).length,
          configuration_source: 'pipeline',
          sql_function: `standard_search_function_${organizationName}`,
          organization_specific: true
        };
        
        searchType = 'standard';
        
      }
    }
    
    if (!isDemo && organizationName && !results) {
      
      // Log when no search configuration is available from the unified pipeline
      if (!searchConfig) {
        debug.log(`[API SEARCH] ⚠️ No search configuration available from unified pipeline`);
        debug.log(`[API SEARCH] 📊 This indicates a pipeline failure or invalid query classification`);
        debug.log(`[API SEARCH] 🔄 Pipeline should handle all search routing - no legacy fallbacks`);
      }
    }
    
    // 3. FINAL FALLBACK - Use standard search with basic filters
    if (!results) {
      debug.log(`[API SEARCH] 📊 No results found from any search method`);
      debug.log(`[API SEARCH] ❌ Search execution completed without results`);
      
      searchType = 'standard';
      searchMetadata = {
        search_method: 'no_results_found',
        configuration_source: 'none',
        organization_name: organizationName,
        is_demo_mode: isDemo,
        attempted_methods: 'pipeline_config_and_legacy_routing'
      };
      
      // Return empty results instead of attempting fallback
      results = [];
    }
    
    debug.log(`[API DEBUG] 📊 Final search results:`, {
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
    
  
    
    return NextResponse.json({ 
      results,
      searchType,
      appliedFilters: effectiveFilters,
      searchMetadata,
      filterCount: Object.keys(effectiveFilters).length,
      debug: debug.getLogs() // Include all debug logs in response
    });
  } catch (error: unknown) {
    debug.error('[API] Error in search:', error);
    
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
      stack: errorStack,
      debug: debug.getLogs() // Include all debug logs even on error
    }, { status: 200 }); // Using 200 to ensure client gets the response
  }
}