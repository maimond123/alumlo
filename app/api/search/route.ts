import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('[API] Minimal route handler started');
    
    // Try to parse the request body
    const body = await req.json();
    console.log('[API] Request body parsed:', body);
    
    // Return a simple response
    return NextResponse.json({ 
      message: 'API route is working',
      receivedQuery: body.query 
    });
  } catch (error) {
    console.error('[API] Error in minimal route:', error);
    return NextResponse.json({ 
      error: 'API route failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}