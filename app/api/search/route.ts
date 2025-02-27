import { NextRequest, NextResponse } from 'next/server';
import { LinkedInProfileSearchEngine } from '../../data/ai_search';

export async function POST(req: NextRequest) {
  try {
    const { query, top_k = 10 } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Invalid query parameter' }, { status: 400 });
    }

    const search_engine = new LinkedInProfileSearchEngine();
    const results = await search_engine.search(query, top_k);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Search failed', details: errorMessage }, { status: 500 });
  }
}

// Make sure to also export GET to handle OPTIONS requests (for CORS)
export async function GET() {
  return NextResponse.json({ message: 'Search API is working. Please use POST method with a query parameter.' });
}