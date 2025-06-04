import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface QueryMetadata {
  core_topic: string;
  key_attributes: string[];
  search_dimensions: string[];
  context_level: string;
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

    // First, dynamically analyze the query to understand its topic and metadata
    const metadataResponse = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are analyzing a search query for an alumni database to understand its core topic and metadata.

Analyze the query and return a JSON object with:
1. "core_topic": the main subject/focus of the search (what the user is fundamentally looking for)
2. "key_attributes": array of specific characteristics, qualifiers, or filters mentioned
3. "search_dimensions": array of different aspects or dimensions that could be explored related to this topic
4. "context_level": description of how broad or specific the query is

Be dynamic and adaptive - don't force queries into predefined categories. Instead, understand what the user is actually seeking and identify the natural dimensions for expansion.

Examples:
- "People who went to college" → {
    "core_topic": "educational background", 
    "key_attributes": ["college education", "degree holders"], 
    "search_dimensions": ["degree level", "institution type", "field of study", "graduation timing", "academic achievement"], 
    "context_level": "broad educational filter"
  }

- "Senior engineers at tech startups" → {
    "core_topic": "professional role and company context", 
    "key_attributes": ["senior level", "engineering function", "technology sector", "startup environment"], 
    "search_dimensions": ["seniority variations", "technical specializations", "company stages", "industry focus", "team leadership"], 
    "context_level": "specific career and company profile"
  }

- "Alumni living in California" → {
    "core_topic": "geographic location", 
    "key_attributes": ["California residence", "geographic mobility"], 
    "search_dimensions": ["specific cities", "regional preferences", "work arrangements", "relocation patterns", "proximity factors"], 
    "context_level": "broad geographic filter"
  }

Return only the JSON object.`,
        },
        {
          role: 'user',
          content: query
        },
      ],
    });

    const metadataResult = JSON.parse(metadataResponse.choices[0].message.content || '{}');

    // Generate dynamic expansions based on the identified metadata and dimensions
    const expansionPrompt = `You are generating related search queries for an alumni database.

Original query: "${query}"

Query analysis:
- Core topic: ${metadataResult.core_topic}
- Key attributes: ${metadataResult.key_attributes?.join(', ')}
- Searchable dimensions: ${metadataResult.search_dimensions?.join(', ')}
- Context: ${metadataResult.context_level}

Generate 3 related search queries that explore different aspects of the same core topic. Use the identified search dimensions to create variations that would find similar but complementary profiles.

The database contains rich information about:
- Educational background (schools, degrees, majors, academic achievements, timing)
- Career progression (job levels, functions, industries, company types, leadership roles)
- Geographic patterns (locations, mobility, work arrangements)
- Professional experience (skills, expertise areas, career transitions)
- Company context (sizes, industries, stages, cultures)
- Temporal elements (career timing, progression patterns, transitions)

Guidelines:
- Build naturally from the core topic and key attributes identified
- Explore the search dimensions in different ways
- Keep each expansion relevant but distinct from the original
- Make them specific enough to be useful but broad enough to find results
- Keep each suggestion under 12 words

Just provide the 3 expansions separated by "•" characters, no numbering or additional text.`;

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

    // Create a stream that includes metadata
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // First, send the metadata
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
            metadata: metadataResult 
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