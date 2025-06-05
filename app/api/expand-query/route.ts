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
    const expansionPrompt = `You are an expert in crafting advanced search queries for a rich alumni database. Your goal is to help users explore the database thoroughly by generating diverse and insightful related search queries.

Original query: "${query}"

Query analysis from a previous step:
- Core topic: ${metadataResult.core_topic}
- Key attributes: ${metadataResult.key_attributes?.join(', ')}
- Searchable dimensions: ${metadataResult.search_dimensions?.join(', ')}
- Context: ${metadataResult.context_level}

Based on this analysis and the detailed database schema below, generate 3 related search queries. These queries should be **significantly more thorough** and explore different facets of the original query by leveraging the specific data points available.

**Detailed Database Schema Highlights:**

Our alumni database contains comprehensive information, including but not limited to:

1.  **Core Profile:** Name, headline, location, current company, current title, current industry.
2.  **[Your Organization] Specifics:** Exit year from [Your Organization], multiple stints at [Your Organization].
3.  **Career History:** Detailed lists of post-[Your Organization] companies, titles, industries, and locations.
4.  **Education History:** Undergraduate, graduate, high school, and education pursued pre, during, or post-[Your Organization]. Specifics like majors, specializations, and school rankings.
5.  **Career Progression & Leadership:** Job levels (e.g., entry, mid, senior, executive), job functions (e.g., engineering, marketing, operations), leadership indicators (e.g., \`is_current_leader\`, \`management_experience\`), revenue responsibility, years since leaving [Your Organization].
6.  **Company & Industry Intelligence:** Current company size (e.g., startup, SME, enterprise), experience in startups vs. enterprise, patterns of industry transitions.
7.  **Skills & Experience:** Indicators for technical backgrounds, sales, consulting, or specific operational experience (e.g., restaurant operations), remote work status, location in major metro areas, total number of positions held, average job tenure.
8.  **Advanced Education Details:** Highest degree obtained, school ranking tiers (e.g., elite, top-tier), STEM vs. business education, continued learning (e.g., executive education, technical certifications).
9.  **Derived Insights:** Career trajectory assessments (e.g., fast-track, specialized), mentor potential, post-[Your Organization] success level, how [Your Organization] experience was leveraged.
10. **[Your Organization]-Specific Career Metrics:** Salary growth post-[Your Organization], career acceleration scores, time to achieve specific salary milestones or management roles, percentages of roles in different functions (operations, management), C-suite achievements.
11. **Targeted Search Categories:** Pre-defined \`functional_expertise\` (e.g., "Product Management", "Data Science"), \`industry_expertise\` (e.g., "SaaS", "Healthcare"), current \`career_stage\` (e.g., "Early Career", "Mid-Career", "Executive"), \`likely_job_seeking\` status.
12. **Temporal Analysis:** Detailed career timelines, lists of years at [Your Organization], post-[Your Organization] career paths with functions and companies over time.
13. **Natural Language Fields:** Rich text descriptions of career progression, expertise, education, company experience, and geographic profiles, suitable for semantic matching.

**Guidelines for Generating Expansions:**

-   **Be Thorough & Specific:** Leverage the detailed fields above to make your suggested queries highly specific and nuanced. Don\\'t just list broad categories; think about how these fields can be combined.
-   **Explore Dimensions Creatively:** Use the "Searchable dimensions" from the analysis and the schema details to create variations that find similar yet complementary profiles. Think about what a user trying to understand the alumni pool deeply would want to explore next.
-   **Distinct & Complementary:** Each of the 3 expansions should be relevant to the original query\\'s core topic but offer a unique angle or a deeper dive into one of the available data dimensions.
-   **Actionable Queries:** Phrase them as if a user would type them into a search bar.
-   **Conciseness:** Keep each suggested expansion under 15 words if possible, but prioritize clarity and specificity.
-   **Focus on Variety:** Try to touch upon different categories from the schema in your suggestions if appropriate for the original query.

**Output Format:**
Provide exactly 3 expansions, separated by "•" characters. No numbering, no intro/outro text, just the queries.

Example Input: "Alumni in tech leadership"
Example Output: "Tech leaders with startup experience • Alumni in C-suite roles at enterprise tech companies • Engineering VPs with 10+ years since [Your Organization]"`;

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