import { NextRequest, NextResponse } from 'next/server';
import { LinkedInProfileSearchEngine } from '../../data/ai_search';

export async function POST(req: NextRequest) {
  console.log('Search API route handler started');
  
  try {
    console.log('Parsing request body');
    const body = await req.json().catch(e => {
      console.error('Failed to parse request body:', e);
      throw e;
    });
    
    const { query, top_k = 10 } = body;
    console.log('Request parsed successfully:', { query, top_k });
    
    if (!query || typeof query !== 'string') {
      console.log('Invalid query parameter');
      return NextResponse.json({ error: 'Invalid query parameter' }, { status: 400 });
    }

    console.log('Initializing search engine...');
    const search_engine = new LinkedInProfileSearchEngine();
    
    console.log('Executing search with query:', query);
    const results = await search_engine.search(query, top_k);
    
    console.log('Search completed successfully');
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : 'No stack trace';
    return NextResponse.json({ 
      error: 'Search failed', 
      details: errorMessage,
      stack: stack 
    }, { status: 500 });
  }
}