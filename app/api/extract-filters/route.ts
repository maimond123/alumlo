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
          content: `You are an AI assistant specialized in extracting structured search filters from user queries for a highly detailed alumni database. Your output will directly influence database filtering, so precision and adherence to the schema are paramount.

Analyze the user's query and identify explicit or very strongly implied filters. Map these filters to the most relevant categories and fields from the database schema provided below.

**Key Database Schema Fields for Filtering:**

*   **Core Profile:** \`name\`, \`headline\`, \`home_location\`, \`post_company_current_company\`, \`post_company_current_title\`, \`post_company_current_industry\`, \`post_company_current_location\`.
*   **[Your Organization] Specifics:** \`[Your Organization]_exit_year\`, \`had_multiple_company_stints\`.
*   **Career Arrays (for broad matching):** \`post_company_companies\`, \`post_company_titles\`, \`post_company_industries\`, \`post_company_locations\`.
*   **Education Arrays:** \`undergraduate_school\`, \`graduate_school\`, \`high_school\`. Specific majors like \`undergraduate_major\`, \`graduate_specialization\`.
*   **Career Progression & Leadership:** \`current_job_level\` (e.g., "Entry Level", "Director", "C-Suite"), \`current_job_function\` (e.g., "Software Engineering", "Marketing"), \`is_current_leader\`, \`management_experience\`, \`revenue_responsibility\`, \`years_since_[Your Organization]\`.
*   **Company & Industry Intelligence:** \`current_company_size_category\` (e.g., "Startup", "Enterprise"), \`has_startup_experience\`, \`has_enterprise_experience\`, \`industry_transitions\` (array).
*   **Skills & Experience Patterns:** \`technical_background\`, \`sales_experience\`, \`consulting_experience\`, \`restaurant_operations_experience\`, \`is_remote_worker\`, \`major_metro_area\`.
*   **Educational Background:** \`highest_degree_level\` (e.g., "Bachelor\\'s Degree", "PhD"), \`school_ranking_tier\` (e.g., "Ivy League", "Top 50"), \`stem_education\`, \`business_education\`, \`elite_education\`, \`major_category\`.
*   **Derived Intelligence:** \`career_trajectory\` (e.g., "Fast-track", "Specialized"), \`mentor_potential\`.
*   **Targeted Search Categories:** \`functional_expertise\` (array, e.g., "Product Management"), \`industry_expertise\` (array, e.g., "SaaS"), \`career_stage\` (e.g., "Mid-Career").
*   **Temporal Elements:** Specific years (e.g., "2018"), ranges (e.g., "after 2020").

**Output Format & Guidelines:**

1.  **Categorize Filters:** Group extracted values under clear, descriptive category names (you can define these, e.g., "Job Levels", "Industries", "School Names", "Degree Levels", "Locations", "Skills", "Company Size", "Years Active").
2.  **Exact Values & Schema Alignment:** When possible, try to match extracted values to typical values found in the schema fields (e.g., if query says "VP", map to "Job Levels: VP/SVP"). For free text like company or school names, use the text as is.
3.  **Be Highly Selective:** Only extract filters that are *clearly and explicitly stated or very strongly implied* by the query. Do NOT infer or add filters that aren't evident. If a query term is ambiguous, err on the side of not extracting it as a structured filter (it will still be caught by semantic search).
4.  **Arrays vs. Single Values:** If a schema field is an array (e.g., \`functional_expertise\`), the extracted filter for that category can have multiple comma-separated values.
5.  **Output Format:**
    Category Name 1: value1, value2
    Category Name 2: valueA
    (Use a newline for each new category).
6.  **No Filters Case:** If no specific filters can be confidently extracted, output *only* the exact phrase: "No specific filters detected".

**Examples (Illustrative - adapt to your schema and categories you define):**

Query: "Senior AI engineers at Google in San Francisco who graduated after 2015"
Extracted Filters:
Job Levels: Senior Level
Targeted Functional Expertise: Software Engineering, AI Development
Company Names: Google
Locations: San Francisco
Years Active: after 2015

Query: "MBA graduates from Ivy League schools who became startup founders in FinTech"
Degree Levels: MBA
School Ranking Tiers: Ivy League
Company Sizes: Startup
Targeted Industry Expertise: FinTech
Job Levels: Founder

Query: "Marketing VPs with experience in B2B SaaS, left [Your Organization] around 2018"
Job Levels: VP/SVP
Job Functions: Marketing
Targeted Industry Expertise: SaaS, B2B
[Your Organization] Exit Year: around 2018

Query: "Consultants with restaurant operations experience"
Job Functions: Consulting
Skills & Experience: Restaurant operations experience

Return only the filter string, no other text.`,
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