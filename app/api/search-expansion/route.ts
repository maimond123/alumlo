import { NextRequest, NextResponse } from 'next/server';

// Import the search engine
const { LinkedInProfileSearchEngine } = require('../../data/ai_search');

export async function POST(req: NextRequest) {
  console.log('[EXPANSION API] 🔍 Search expansion API called');
  
  try {
    const body = await req.json();
    console.log('[EXPANSION API] 📝 Request body received:', {
      hasExpansionResults: !!body.expansionResults,
      variantCount: body.expansionResults?.variants?.length || 0,
      organizationName: body.organizationName,
      hasInitialResults: !!body.initialResults,
      initialResultCount: body.initialResults?.length || 0
    });
    
    const { 
      expansionResults,
      organizationName,
      initialResults = []
    } = body;
    
    if (!expansionResults || !expansionResults.variants || !expansionResults.additionalSearchConfigs) {
      console.log('[EXPANSION API] ❌ Missing expansion data');
      return NextResponse.json({ 
        results: [],
        error: 'Missing expansion data' 
      }, { status: 400 });
    }
    
    if (!organizationName) {
      console.log('[EXPANSION API] ❌ Missing organization name');
      return NextResponse.json({ 
        results: [],
        error: 'Organization name is required' 
      }, { status: 400 });
    }
    
    console.log('[EXPANSION API] 🔧 Initializing search engine');
    const search_engine = new LinkedInProfileSearchEngine();
    
    console.log('[EXPANSION API] 🔍 Starting expansion searches');
    const expansionSearchResults: any[] = [];
    const initialResultIds = new Set(initialResults.map((r: any) => r.id));
    
    // Track expansion metadata
    const expansionMetadata = {
      variants_processed: 0,
      successful_searches: 0,
      failed_searches: 0,
      total_expansion_results: 0,
      unique_expansion_results: 0,
      expansion_queries: [] as string[]
    };
    
    for (let i = 0; i < expansionResults.variants.length; i++) {
      const expansionVariant = expansionResults.variants[i];
      const expansionConfig = expansionResults.additionalSearchConfigs[i];
      
      console.log(`[EXPANSION API] 🔍 Processing expansion ${i + 1}/${expansionResults.variants.length}`);
      console.log(`[EXPANSION API] 📝 Expansion query: "${expansionVariant.natural_language_query}"`);
      console.log(`[EXPANSION API] 🔧 Expansion filters:`, expansionConfig.filters);
      
      expansionMetadata.variants_processed++;
      expansionMetadata.expansion_queries.push(expansionVariant.natural_language_query);
      
      try {
        const expansionSearchResults = await search_engine.searchChronological(
          expansionVariant.natural_language_query,
          expansionConfig.filters,
          50,
          organizationName
        );
        
        console.log(`[EXPANSION API] ✅ Expansion search ${i + 1} completed: ${expansionSearchResults.length} results`);
        expansionMetadata.successful_searches++;
        expansionMetadata.total_expansion_results += expansionSearchResults.length;
        
        // Filter out duplicates (profiles already in initial results)
        const uniqueExpansionResults = expansionSearchResults.filter((result: any) => 
          !initialResultIds.has(result.id)
        );
        
        console.log(`[EXPANSION API] 🔄 After deduplication: ${uniqueExpansionResults.length} unique results`);
        
        // Add unique results to expansion collection
        uniqueExpansionResults.forEach((result: any) => {
          if (!expansionSearchResults.some((existing: any) => existing.id === result.id)) {
            expansionSearchResults.push(result);
            initialResultIds.add(result.id); // Prevent duplicates in subsequent expansions
            expansionMetadata.unique_expansion_results++;
          }
        });
        
      } catch (expansionError) {
        console.error(`[EXPANSION API] ❌ Expansion search ${i + 1} failed:`, {
          error: expansionError,
          message: expansionError instanceof Error ? expansionError.message : 'Unknown error',
          expansionQuery: expansionVariant.natural_language_query
        });
        expansionMetadata.failed_searches++;
        // Continue with other expansion searches even if one fails
      }
    }
    
    console.log('[EXPANSION API] ✅ All expansion searches completed:', expansionMetadata);
    
    return NextResponse.json({
      results: expansionSearchResults,
      metadata: expansionMetadata
    });
    
  } catch (error) {
    console.error('[EXPANSION API] ❌ Critical error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    });
    
    return NextResponse.json({ 
      results: [],
      error: 'Expansion search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 