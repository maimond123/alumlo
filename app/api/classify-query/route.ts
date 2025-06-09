import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    
    console.log('Classifying query for temporal elements:', query);
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a query classification system for an alumni search database. Your job is to determine if a user query contains temporal elements that would benefit from specialized temporal search.

**Temporal Query Indicators:**
- Specific years (e.g., "2018", "2019-2021", "after 2020")
- Time-based sequences (e.g., "then became", "later moved to", "after leaving")
- Career progression patterns (e.g., "went from X to Y", "transitioned to")
- Exit timing references (e.g., "left in", "graduated in", "departed")
- Sequential job functions (e.g., "started as X, then Y", "first worked as X, now Y")

**Classification Output:**
If the query contains temporal elements, respond with:
{
  "type": "temporal",
  "temporal_elements": {
    "years": [array of years as numbers],
    "functions": [array of job functions/roles as strings],
    "sequence_detected": boolean,
    "exit_years": [array of exit years as numbers]
  }
}

If the query does NOT contain temporal elements, respond with:
{
  "type": "standard"
}

**Examples:**

Query: "People who left in 2019 and became consultants"
{
  "type": "temporal",
  "temporal_elements": {
    "years": [2019],
    "functions": ["consultant"],
    "sequence_detected": true,
    "exit_years": [2019]
  }
}

Query: "Alumni who worked here in 2020, then moved to tech startups in 2022"
{
  "type": "temporal",
  "temporal_elements": {
    "years": [2020, 2022],
    "functions": ["tech startup"],
    "sequence_detected": true,
    "exit_years": [2020]
  }
}

Query: "Software engineers in San Francisco"
{
  "type": "standard"
}

Query: "People who transitioned to finance after graduation"
{
  "type": "temporal",
  "temporal_elements": {
    "years": [],
    "functions": ["finance"],
    "sequence_detected": true,
    "exit_years": []
  }
}

Respond only with valid JSON, no other text.`,
        },
        {
          role: 'user',
          content: query
        },
      ],
    });

    const classificationText = response.choices[0]?.message?.content;
    
    if (!classificationText) {
      throw new Error('No classification response received');
    }

    // Parse the JSON response
    let classification;
    try {
      classification = JSON.parse(classificationText);
    } catch (parseError) {
      console.error('Failed to parse classification JSON:', classificationText);
      // Default to standard search if classification fails
      classification = { type: 'standard' };
    }

    console.log('Query classification result:', classification);
    
    return NextResponse.json(classification);
  } catch (error: any) {
    console.error('Query classification error:', error);
    
    // Return standard classification as fallback
    return NextResponse.json({ 
      type: 'standard'
    });
  }
} 