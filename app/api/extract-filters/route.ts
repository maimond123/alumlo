import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    
    console.log('Extracting comprehensive filters for query:', query);
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      stream: true,
      messages: [
        {
          role: 'system',
          content: `You are an expert query analysis system for a sophisticated alumni search database. You excel at extracting structured metadata filters from natural language search queries.

**Available Filter Categories:**

**Primary Categories:**
1. Job Levels: Entry-level, Senior, Manager, Director, VP, C-Suite, Founder
2. Job Functions: Engineering, Marketing, Sales, Operations, Finance, HR, Product, Legal, Consulting, Healthcare, Education
3. Industries: Technology, Finance, Healthcare, Consulting, Retail, Manufacturing, Education, Government, Non-profit
4. Company Names: Specific company names mentioned in the query
5. Locations: Cities, states, countries, regions mentioned
6. School Names: Universities, colleges mentioned (beyond the organization being searched)
7. Degree Levels: High School, Bachelor's, Master's, PhD, Professional Degree
8. Major Categories: Engineering, Business, Sciences, Liberal Arts, Medicine, Law

**Advanced Boolean Categories:**
9. Leadership: Queries indicating leadership roles or experience
10. Management Experience: Managing teams, supervisory roles
11. Technical Background: Engineering, coding, technical skills
12. Sales Experience: Sales roles, business development
13. Startup Experience: Startup environments, early-stage companies
14. Enterprise Experience: Large corporation experience
15. Remote Work: Remote work arrangements, distributed teams
16. Mentor Potential: Teaching, mentoring, coaching experience

**Specialized Categories:**
17. Functional Expertise: Specific skill areas (AI, Marketing Analytics, etc.)
18. Industry Expertise: Deep industry knowledge beyond current role
19. Exit Years: Years when people left the organization
20. Salary Impact: Salary improvements, financial advancement
21. Career Transitions: Job changes, career pivots
22. Geographic Movement: Relocation patterns

**Instructions:**
- Extract 1-3 values per relevant category
- Only include categories with clear evidence in the query
- Use specific, searchable terms
- If no specific filters detected, respond: "No specific filters detected"

**Examples:**

Query: "Software engineers in San Francisco who became VPs"
Job Functions: Software Engineering
Job Levels: VP
Locations: San Francisco
Leadership: Current Leader

Query: "People who left in 2019 and started consulting companies"
Exit Years: 2019
Job Functions: Consulting
Startup Experience: Startup Experience
Leadership: Founder

Query: "MBA graduates now in tech sales roles"
Degree Levels: MBA
Job Functions: Sales
Industries: Technology

Query: "Former managers who moved to remote work"
Management Experience: Has Management Experience
Remote Work: Remote Worker

Query: "Alumni working at Google or Apple in AI"
Company Names: Google, Apple
Functional Expertise: Artificial Intelligence

Respond with the category name followed by a colon and comma-separated values. One category per line.`,
        },
        {
          role: 'user',
          content: query
        },
      ],
    });

    // Create a new stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
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
    console.error('Filter extraction error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred while processing your request' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}