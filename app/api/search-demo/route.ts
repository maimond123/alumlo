import { NextResponse } from 'next/server';
import { LinkedInProfileSearchEngine } from '../../data/ai_search';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { message: 'Invalid query parameter' },
        { status: 400 }
      );
    }

    // Create search engine instance
    const searchEngine = new LinkedInProfileSearchEngine();
    await searchEngine.initializeEmbedder();

    // Use the real search but with hardcoded parameters for the demo
    // We want to specifically search the public demo table
    const results = await searchEngine.searchDemoData(query, 10);

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Demo search API error:', error);
    return NextResponse.json(
      { message: error.message || 'An error occurred during search' },
      { status: 500 }
    );
  }
}