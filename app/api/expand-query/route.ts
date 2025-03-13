import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Default to chat/completions if no endpoint is specified
    const { endpoint = 'chat/completions', query, ...otherData } = body;

    console.log('Received request for endpoint:', endpoint);
    console.log('Request data:', { query, ...otherData });

    let requestData;
    let response;
    
    // If there's a query but no messages, format it for the chat API
    if (query && !otherData.messages) {
      requestData = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: query }],
        ...otherData
      };
    } else {
      requestData = otherData;
    }
    
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