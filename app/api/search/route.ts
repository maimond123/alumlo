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

// Add timeout handling at the top
const SEARCH_TIMEOUT_MS = 30000; // 30 seconds

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
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
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
      hasFilters: !!body.filters && Object.keys(body.filters).length > 0,
      hasChronologicalWeights: !!body.chronologicalWeights
    });
    
    const { 
      query, 
      top_k = 10, 
      filters = {}, 
      organizationName, 
      isDemo = false,
      queryClassification,
      chronologicalWeights,
      useChronologicalConfig = false,
      chronologicalConfig,
      searchConfig // New: pipeline search config
    } = body;
    
    // BUGFIX: Use enhanced filters from pipeline when available
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
      hasChronologicalWeights: !!chronologicalWeights,
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
    
    debug.log(`[API DEBUG] Using gap-based filtering instead of fixed top_k=${top_k}`);

    // Try each step separately to identify where the error occurs
    debug.log('[API] Creating search engine instance');
    debug.log(`[API SEARCH] 🔧 Initializing search engine`);
    const search_engine = new LinkedInProfileSearchEngine();
    
    debug.log(`[API] Executing search with query: "${query}", isDemo: ${isDemo}`);
    debug.log(`[API DEBUG] Organization context: "${organizationName}"`);
    debug.log(`[API SEARCH] 🎯 Starting search execution`);
    
    // Route to appropriate search method
    let results;
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
            search_engine.searchTemporal(
              query,
              searchConfig.temporalElements,
              50,
              organizationName
            ),
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
          results = null;
        }
      }
      
      else if (searchConfig.type === 'chronological' && searchConfig.filters) {
        debug.log(`[API SEARCH] 📈 Executing chronological search from pipeline`);
        debug.log(`[API SEARCH] 📈 DETAILED: Chronological search configuration:`, {
          filters: searchConfig.filters,
          hasWeights: !!searchConfig.weights,
          sqlFunction: searchConfig.sqlFunction,
          organizationName: organizationName
        });
        
        try {
          debug.log(`[API SEARCH] 📈 DETAILED: Calling searchChronological with parameters:`, {
            query: `"${query}"`,
            filtersCount: Object.keys(searchConfig.filters).length,
            weightsCount: searchConfig.weights ? Object.keys(searchConfig.weights).length : 0,
            limit: 50,
            organizationName: organizationName
          });
          
          // 🔍 DETAILED FILTER LOGGING FOR DEBUGGING - CHRONOLOGICAL
          debug.log(`[API SEARCH] 🔍 EXACT CHRONOLOGICAL FILTERS BEING SENT TO SQL:`, JSON.stringify(searchConfig.filters, null, 2));
          debug.log(`[API SEARCH] 🔍 CHRONOLOGICAL SQL FUNCTION CALL: ${searchConfig.sqlFunction}(chronological_filters: ${JSON.stringify(searchConfig.filters)}, limit_count: 50)`);
          
          // Execute primary search only (expansion will be handled separately)
          results = await withTimeout(
            search_engine.searchChronological(
              query,
              searchConfig.filters,
              50,
              organizationName,
              searchConfig.weights // May be undefined for new pipeline
            ),
            SEARCH_TIMEOUT_MS
          );
          
          debug.log(`[API SEARCH] 📈 DETAILED: Primary chronological search completed:`, {
            resultCount: Array.isArray(results) ? results.length : 0,
            hasResults: !!results && Array.isArray(results),
            isArray: Array.isArray(results),
            firstResultId: Array.isArray(results) && results.length > 0 ? results[0]?.id : 'none',
            sqlFunction: searchConfig.sqlFunction,
            filtersUsed: Object.keys(searchConfig.filters || {}),
            queryUsed: query
          });
          
          // Set metadata for primary search only
          searchMetadata = {
            search_method: 'chronological_pipeline_primary',
            filters: searchConfig.filters,
            weights: searchConfig.weights,
            sql_function: searchConfig.sqlFunction,
            configuration_source: 'pipeline',
            strict_filtering: true,
            expansion_available: !!(body.expansionResults && body.expansionResults.variants && body.expansionResults.variants.length > 0)
          };
          
          debug.log(`[API SEARCH] ✅ Primary chronological search completed with ${Array.isArray(results) ? results.length : 0} results`);
          searchType = 'chronological';
          
        } catch (error) {
          debug.error(`[API SEARCH] ❌ DETAILED: Chronological search from pipeline failed:`, {
            error: error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : 'No stack',
            errorName: error instanceof Error ? error.name : 'Unknown',
            searchConfig: searchConfig,
            organizationName: organizationName
          });
          
          // Log but don't throw - let it fall through to fallback
          debug.log(`[API SEARCH] 🔄 Chronological search failed, will try fallback methods`);
          results = null;
        }
      }
      
      else if (searchConfig.type === 'standard') {
        debug.log(`[API SEARCH] 📊 Standard search requested from pipeline`);
        debug.log(`[API SEARCH] 📊 DETAILED: Standard search configuration:`, {
          rpcFunction: searchConfig.searchMethod,
          hasFilters: !!searchConfig.enhancedFilters,
          filterKeys: Object.keys(searchConfig.enhancedFilters || {}),
          filterValues: searchConfig.enhancedFilters,
          filterCount: Object.keys(searchConfig.enhancedFilters || {}).length,
          isEmptyFilters: Object.keys(searchConfig.enhancedFilters || {}).length === 0
        });
        
        // 🔍 DETAILED FILTER LOGGING FOR DEBUGGING
        debug.log(`[API SEARCH] 🔍 EXACT FILTERS BEING SENT TO SQL:`, JSON.stringify(searchConfig.enhancedFilters, null, 2));
        debug.log(`[API SEARCH] 🔍 SQL FUNCTION CALL: ${searchConfig.searchMethod}(search_filters: ${JSON.stringify(searchConfig.enhancedFilters)}, search_query: "${query}", limit_count: ${top_k})`);
        
        // Call the standardSearch with the enhanced filters
        results = await withTimeout(
          search_engine.standardSearch(
            query,
            searchConfig.enhancedFilters,
            top_k,
            organizationName
          ),
          SEARCH_TIMEOUT_MS
        );
        
        debug.log(`[API SEARCH] 🔍 DETAILED: Standard search completed:`, {
          resultCount: Array.isArray(results) ? results.length : 0,
          hasResults: !!results && Array.isArray(results),
          isArray: Array.isArray(results),
          firstResultId: Array.isArray(results) && results.length > 0 ? results[0]?.id : 'none',
          sqlFunction: searchConfig.searchMethod,
          filtersUsed: Object.keys(searchConfig.enhancedFilters || {}),
          queryUsed: query
        });
        
        debug.log(`[API SEARCH] ✅ Comprehensive SQL filtering completed: ${Array.isArray(results) ? results.length : 0} results`);
        
        searchMetadata = {
          search_method: 'comprehensive_sql_filtering',
          enhanced_filters: searchConfig.enhancedFilters,
          filter_count: Object.keys(searchConfig.enhancedFilters || {}).length,
          configuration_source: 'pipeline',
          sql_function: `comprehensive_standard_search_${organizationName}`,
          organization_specific: true
        };
        
        searchType = 'standard';
        
      }
    }
    
    if (!isDemo && organizationName && !results) {
      
      // NEW: Check if we should use the pre-configured chronological setup
      if (useChronologicalConfig && chronologicalConfig) {
        debug.log(`[API DEBUG] 🔗 USING PRE-CONFIGURED CHRONOLOGICAL SEARCH`);
        debug.log(`[API DEBUG] 🔗 Chronological config:`, chronologicalConfig);
        debug.log(`[API SEARCH] 🔗 Processing pre-configured chronological setup`);
        
        try {
          results = await search_engine.searchChronological(
            query,
            chronologicalConfig.enhancedFilters,
            50,
            organizationName,
            chronologicalConfig.sqlParameters?.weight_assignment
          );
          
          if (results.length > 0) {
            debug.log(`[API DEBUG] 🔗 Pre-configured chronological search returned ${results.length} results`);
            debug.log(`[API SEARCH] ✅ Pre-configured chronological search successful: ${results.length} results`);
            searchType = 'chronological';
            searchMetadata = {
              chronological_config: chronologicalConfig,
              configuration_source: 'pre-configured'
            };
          } else {
            debug.log(`[API DEBUG] 🔗 Pre-configured chronological search returned no results, falling back`);
            debug.log(`[API SEARCH] ⚠️ Pre-configured chronological search returned no results`);
            results = null; // Will fall through to standard search
          }
        } catch (error: unknown) {
          debug.log(`[API DEBUG] 🔗 Pre-configured chronological search failed, falling back:`, error);
          debug.log(`[API SEARCH] ❌ Pre-configured chronological search failed:`, error);
          results = null; // Will fall through to standard search
        }
      }
      
      // LEGACY: Old temporal and chronological routing (only if not using pre-configured)
      else if (queryClassification?.type && !searchConfig) {
        debug.log(`[API SEARCH] 🔄 Processing legacy classification routing`);
        
        // 1. TEMPORAL SEARCH - For date-specific timeline queries
        if (queryClassification.type === 'temporal') {
          debug.log(`[API DEBUG] 🕐 TEMPORAL search detected for ${organizationName}`);
          debug.log(`[API DEBUG] 🕐 Using temporal search method`);
          debug.log(`[API SEARCH] 🕐 Executing legacy temporal search`);
          
          try {
            // For temporal search, we'll need to extract temporal elements within the search method
            // or pass a flag to indicate temporal processing is needed
            results = await search_engine.searchTemporal(
              query,
              {}, // Let the search method extract temporal elements
              50, // Use higher limit for gap-based filtering
              organizationName
            );
            
            if (results.length > 0) {
              debug.log(`[API DEBUG] 🕐 Temporal search returned ${results.length} results`);
              debug.log(`[API SEARCH] ✅ Legacy temporal search successful: ${results.length} results`);
              searchType = 'temporal';
              searchMetadata = { search_method: 'temporal_legacy' };
            } else {
              debug.log(`[API DEBUG] 🕐 Temporal search returned no results, falling back to standard search`);
              debug.log(`[API SEARCH] ⚠️ Legacy temporal search returned no results`);
              results = null; // Will fall through to standard search
            }
          } catch (error: unknown) {
            debug.log(`[API DEBUG] 🕐 Temporal search failed, falling back to standard search:`, error);
            debug.log(`[API SEARCH] ❌ Legacy temporal search failed:`, error);
            results = null; // Will fall through to standard search
          }
        }
        
        // 2. LEGACY CHRONOLOGICAL SEARCH - For career progression pattern queries (with redundant LLM calls)
        else if (queryClassification.type === 'chronological') {
          debug.log(`[API DEBUG] 📈 LEGACY CHRONOLOGICAL search detected for ${organizationName}`);
          debug.log(`[API DEBUG] ⚠️  WARNING: Using legacy chronological path with redundant LLM calls`);
          debug.log(`[API SEARCH] 📈 Executing legacy chronological search with redundant LLM calls`);
          
          try {
            // Legacy redundant weight assignment
            let legacyChronologicalWeights = chronologicalWeights; // Use passed weights if available
            if (!legacyChronologicalWeights) {
              debug.log(`[API SEARCH] ⚖️ Performing redundant weight assignment`);
              try {
                const weightResponse = await fetch('/api/assign-weights', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query })
                });
                if (weightResponse.ok) {
                  legacyChronologicalWeights = await weightResponse.json();
                  debug.log(`[API DEBUG] 📈 Legacy assigned chronological weights:`, legacyChronologicalWeights);
                  debug.log(`[API SEARCH] ✅ Legacy weight assignment completed`);
                }
              } catch (weightError) {
                debug.log(`[API DEBUG] 📈 Legacy weight assignment failed, using defaults:`, weightError);
                debug.log(`[API SEARCH] ❌ Legacy weight assignment failed`);
              }
            }
            
            // Legacy chronological filter translation
            let translatedFilters = {};
            debug.log(`[API SEARCH] 🔄 Performing redundant filter translation`);
            try {
              const translateResponse = await fetch('/api/translate-chronological', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
              });
              if (translateResponse.ok) {
                translatedFilters = await translateResponse.json();
                debug.log(`[API DEBUG] 📈 Legacy translated chronological filters:`, translatedFilters);
                debug.log(`[API SEARCH] ✅ Legacy filter translation completed`);
              }
            } catch (translateError) {
              debug.log(`[API DEBUG] 📈 Legacy filter translation failed, using basic filters:`, translateError);
              debug.log(`[API SEARCH] ❌ Legacy filter translation failed`);
              translatedFilters = { gap_tolerance: 6 };
            }
            
            // Combine translated filters with existing filters
            const chronologicalFilters = {
              ...translatedFilters,
              ...effectiveFilters, // Include any existing filters from dashboard or pipeline
            };
            
            // Add weights to filters
            if (legacyChronologicalWeights) {
              chronologicalFilters.chronological_weights = legacyChronologicalWeights;
            }
            
            debug.log(`[API DEBUG] 📈 Legacy final chronological filters:`, chronologicalFilters);
            debug.log(`[API SEARCH] 📊 Final legacy chronological configuration prepared`);
            
            results = await search_engine.searchChronological(
              query,
              chronologicalFilters,
              50,
              organizationName
            );
            
            if (results.length > 0) {
              debug.log(`[API DEBUG] 📈 Legacy chronological search returned ${results.length} results`);
              debug.log(`[API SEARCH] ✅ Legacy chronological search successful: ${results.length} results`);
              searchType = 'chronological';
              searchMetadata = { 
                search_method: 'legacy_chronological',
                translated_filters: translatedFilters,
                chronological_filters: chronologicalFilters,
                chronological_weights: legacyChronologicalWeights,
                configuration_source: 'legacy'
              };
            } else {
              debug.log(`[API DEBUG] 📈 Legacy chronological search returned no results, falling back to standard search`);
              debug.log(`[API SEARCH] ⚠️ Legacy chronological search returned no results`);
              results = null; // Will fall through to standard search
            }
          } catch (error: unknown) {
            debug.log(`[API DEBUG] 📈 Legacy chronological search failed, falling back to standard search:`, error);
            debug.log(`[API SEARCH] ❌ Legacy chronological search failed:`, error);
            results = null; // Will fall through to standard search
          }
        }
      }
    }
    
    // 3. FINAL FALLBACK - Use standard search with basic filters
    if (!results) {
      debug.log(`[API SEARCH] 📊 Executing final fallback search`);
      
      // Determine effective organization name
      const effectiveOrgName = organizationName || (isDemo ? 'chick_fil_a' : null);
      
      if (effectiveOrgName) {
        debug.log(`[API SEARCH] 🏢 Using standard search fallback for organization: ${effectiveOrgName}`);
        
        // Use basic filters for fallback
        const basicFallbackFilters = {
          company_filter: effectiveFilters.company || effectiveFilters.company_filter || null,
          industry_filter: effectiveFilters.industry || effectiveFilters.industry_filter || null,
          title_filter: effectiveFilters.title || effectiveFilters.title_filter || null,
          location_filter: effectiveFilters.location || effectiveFilters.location_filter || null,
          school_filter: effectiveFilters.school || effectiveFilters.school_filter || null
        };
        
        debug.log(`[API SEARCH] 🔍 Fallback filters:`, basicFallbackFilters);
        
        try {
          results = await search_engine.standardSearch(
            query,
            basicFallbackFilters,
            50,
            effectiveOrgName
          );
          
          debug.log(`[API SEARCH] ✅ Final fallback completed: ${Array.isArray(results) ? results.length : 0} results`);
          
          searchType = 'standard';
          searchMetadata = {
            search_method: 'standard_search_final_fallback',
            filters: basicFallbackFilters,
            configuration_source: 'final_fallback',
            organization_name: effectiveOrgName,
            is_demo_mode: isDemo,
            fallback_reason: 'no_pipeline_config_or_previous_search_failed'
          };
          
        } catch (error) {
          debug.error(`[API SEARCH] ❌ Final standard search fallback failed:`, {
            error: error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            organization: effectiveOrgName
          });
          
          // Set error metadata and re-throw
          searchType = 'standard';
          searchMetadata = {
            search_method: 'failed_final_fallback',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            configuration_source: 'final_fallback_failed',
            organization_name: effectiveOrgName,
            is_demo_mode: isDemo
          };
          
          throw error;
        }
      } else {
        debug.error(`[API SEARCH] ❌ No organization available for search - cannot proceed`);
        
        searchType = 'standard';
        searchMetadata = {
          search_method: 'no_organization_error',
          error_message: 'No organization name available for search',
          configuration_source: 'final_fallback_failed',
          is_demo_mode: isDemo
        };
        
        // Return empty results instead of throwing
        results = [];
      }
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