import { NextRequest, NextResponse } from 'next/server';
import { LinkedInProfileSearchEngine } from '../../data/ai_search';

export async function POST(req: NextRequest) {
  console.log('[API] Search route handler started');
  
  try {
    console.log('[API] Attempting to parse request body');
    const body = await req.json().catch(e => {
      console.error('[API] Failed to parse request body:', e);
      throw e;
    });
    
    const { query, top_k = 10 } = body;
    console.log('[API] Request parsed successfully:', { query, top_k });
    
    if (!query || typeof query !== 'string') {
      console.log('[API] Invalid query parameter');
      return NextResponse.json({ error: 'Invalid query parameter' }, { status: 400 });
    }

    console.log('[API] About to initialize search engine');
    const search_engine = new LinkedInProfileSearchEngine();
    console.log('[API] Search engine initialized successfully');
    
    console.log('[API] About to execute search with query:', query);
    const results = await search_engine.search(query, top_k);
    console.log('[API] Search completed successfully, results:', results);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[API] Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : 'No stack trace';
    return NextResponse.json({ 
      error: 'Search failed', 
      details: errorMessage,
      stack: stack 
    }, { status: 500 });
  }
}