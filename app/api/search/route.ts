import { NextRequest, NextResponse } from 'next/server';

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
    
    // Try to load the transformers library
    console.log('[API] Testing transformers library load');
    const transformers = await testTransformersLoad();
    console.log('[API] Transformers library loaded successfully:', !!transformers);
    
    // Return a success message with the transformers load status
    return NextResponse.json({ 
      results: [],
      message: 'Transformers library loaded successfully. Full search functionality coming soon.',
      transformersLoaded: true
    });
  } catch (error) {
    console.error('[API] Error in route:', error);
    return NextResponse.json({ 
      results: [],
      error: 'API route failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      transformersLoaded: false
    }, { status: 200 }); // Using 200 to ensure client gets the response
  }
}