import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface QueryClassification {
  type: 'temporal' | 'standard';
  temporal_elements?: {
    years?: number[];
    sequence?: string;
    companies?: string[];
    functions?: string[];
    time_indicators?: string[];
  };
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // First, classify the query type and extract temporal elements
    const classificationResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant analyzing search queries for a comprehensive Chick-fil-A alumni database to determine if they require temporal (timeline-based) or standard search.

Classify the query and return a JSON object with:
1. "type": "temporal" or "standard"
2. "temporal_elements": if temporal, extract:
   - "years": array of years mentioned (e.g., [2018, 2019])
   - "sequence": description of the temporal sequence (e.g., "CFA then consulting")
   - "companies": companies mentioned with timeline context
   - "functions": job functions mentioned with timeline context
   - "time_indicators": temporal words found (then, after, before, etc.)

TEMPORAL queries involve:
- Career transitions over time ("worked at X then went to Y")
- Specific years or time periods ("in 2018", "after 2020")
- Sequential events ("then", "after", "before", "since", "until")
- Career progression patterns ("moved from X to Y", "transitioned")

STANDARD queries are about:
- Current state ("senior engineers", "MBA graduates")
- General characteristics ("tech background", "from top schools")
- Simple filtering without time relationships

Examples:
- "Find alumni who worked at Chick-fil-A in 2018 and then consulting in 2019" 
  → {"type": "temporal", "temporal_elements": {"years": [2018, 2019], "sequence": "CFA then consulting", "companies": ["Chick-fil-A"], "functions": ["consulting"], "time_indicators": ["then"]}}
- "Senior software engineers from top universities"
  → {"type": "standard", "temporal_elements": null}
- "People who left CFA after 2020 and joined startups"
  → {"type": "temporal", "temporal_elements": {"years": [2020], "sequence": "left CFA after 2020 then startups", "companies": ["CFA"], "time_indicators": ["after"]}}

Return only the JSON object, no additional text.`,
        },
        {
          role: 'user',
          content: query
        },
      ],
    });

    const classificationResult = JSON.parse(classificationResponse.choices[0].message.content || '{}');

    // Generate sophisticated expansions based on your rich atomic data
    let expansionPrompt: string;
    
    if (classificationResult.type === 'temporal') {
      expansionPrompt = `You are helping explore temporal career patterns in a sophisticated Chick-fil-A alumni database.

The original query involves career transitions: "${query}"

Generate 3 expanded temporal search queries exploring related career progression patterns. Consider the rich data available:
- Career transitions between company sizes (startup to enterprise, etc.)
- Function transitions (operations to tech, restaurant to consulting)
- Leadership progression over time
- Geographic mobility patterns
- Education pursued during career phases

Keep each suggestion concise (under 12 words) and focused on temporal career patterns.
Just provide the 3 expansions separated by "•" characters, no numbering or additional text.`;
    } else {
      expansionPrompt = `You are helping explore a sophisticated Chick-fil-A alumni database with rich career intelligence.

Original query: "${query}"

The database contains detailed insights including:
- Career progression: job levels, leadership roles, management responsibility, revenue responsibility
- Company intelligence: sizes (startup to enterprise), industries, salary ranges
- Functional expertise: restaurant operations, tech, consulting, sales, finance
- Work styles: remote work, customer-facing roles, travel requirements
- Education depth: school rankings, degree levels, major categories, timing patterns
- Geographic patterns: major metros, mobility, university locations

Generate 3 expanded queries that discover additional relevant alumni using this rich data. Focus on:
- Different career levels or leadership patterns
- Various company types, sizes, or industries  
- Functional expertise variations
- Educational background depth
- Work style or geographic preferences

Keep each suggestion concise (under 10 words) and highly relevant.
Just provide the 3 expansions separated by "•" characters, no numbering or additional text.`;
    }

    const expansionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        {
          role: 'system',
          content: expansionPrompt,
        },
        {
          role: 'user',
          content: query
        },
      ],
    });

    // Create a new stream that includes classification data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // First, send the classification data
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
            classification: classificationResult 
          })}\n\n`));

          // Then stream the expansions
          for await (const chunk of expansionResponse) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
        } catch (error) {
          controller.error(error);
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred while processing your request' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}