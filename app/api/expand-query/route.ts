import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, ...requestData } = body;

    console.log('Received request for endpoint:', endpoint);
    console.log('Request data:', requestData);

    let response;
    
    switch (endpoint) {
      case 'chat/completions':
        response = await openai.chat.completions.create(requestData);
        break;
      case 'completions':
        response = await openai.completions.create(requestData);
        break;
      case 'embeddings':
        response = await openai.embeddings.create(requestData);
        break;
      default:
        console.error('Invalid endpoint:', endpoint);
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    return NextResponse.json({ 
      error: error.message || 'An error occurred while processing your request' 
    }, { status: 500 });
  }
}