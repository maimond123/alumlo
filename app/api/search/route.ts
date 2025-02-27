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

    // Try each step separately to identify where the error occurs
    console.log('[API] Creating search engine instance');
    const search_engine = new LinkedInProfileSearchEngine();
    
    console.log('[API] Initializing embedder');
    await search_engine.initializeEmbedder().catch(error => {
      console.error('[API] Error initializing embedder:', error);
      throw new Error(`Embedder initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    });
    
    console.log('[API] Executing search with query:', query);
    const results = await search_engine.search(query, top_k);
    
    console.log('[API] Search completed successfully, found', results.length, 'results');
    return NextResponse.json({ results });
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