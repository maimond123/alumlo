import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('[API] Route handler started');
    
    // Try to parse the request body
    const body = await req.json();
    console.log('[API] Request body parsed:', body);
    
    // Return a properly structured response with an empty results array
    // This will prevent the "Cannot read properties of undefined (reading 'length')" error
    return NextResponse.json({ 
      results: [],
      message: 'Search functionality is temporarily disabled while we resolve server-side issues.'
    });
  } catch (error) {
    console.error('[API] Error in route:', error);
    return NextResponse.json({ 
      error: 'API route failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      results: [] // Include empty results to prevent client-side errors
    }, { status: 500 });
  }
}