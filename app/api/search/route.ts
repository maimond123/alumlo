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
    
    const { query, top_k = 10 } = body;
    
    if (!query || typeof query !== 'string') {
      console.log('[API] Invalid query parameter');
      return NextResponse.json({ 
        results: [],
        error: 'Invalid query parameter' 
      }, { status: 400 });
    }

    console.log('[API] Initializing search engine');
    const search_engine = new LinkedInProfileSearchEngine();
    
    console.log('[API] Executing search with query:', query);
    const results = await search_engine.search(query, top_k);
    
    console.log('[API] Search completed successfully, found', results.length, 'results');
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[API] Error in search:', error);
    return NextResponse.json({ 
      results: [],
      error: 'Search failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 }); // Using 200 to ensure client gets the response
  }
}