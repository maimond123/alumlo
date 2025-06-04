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
          content: `You are an AI assistant extracting search filters from queries for a comprehensive Chick-fil-A alumni database with rich atomic data processing.

Extract relevant filters from these categories (only include categories with clear matches from the query):

**CAREER PROGRESSION & LEADERSHIP:**
- Job Levels: Entry Level, Associate, Mid Level, Senior Level, Lead/Principal, Manager, Director, VP/SVP, C-Suite, Founder/Owner
- Job Functions: Restaurant Operations, Food Service Management, Software Engineering, Data Science/Analytics, Product Management, Finance, Consulting, Sales, Business Development, Marketing, Operations Management, Human Resources, Legal, Healthcare, Real Estate, etc.
- Leadership Indicators: Leadership roles, Management responsibility, Revenue responsibility, Team management
- Career Context: Customer-facing roles, Travel-required positions, Full-time, Part-time, Contract, Internship

**COMPANY & INDUSTRY INTELLIGENCE:**
- Company Sizes: Startup (1-50 employees), Small (51-200 employees), Medium (201-1000 employees), Large (1001-5000 employees), Enterprise (5000+ employees)
- Industries: Quick Service Restaurant (QSR), Food & Beverage, Technology & Software, Financial Services, Healthcare & Pharmaceuticals, Management Consulting, Retail & Consumer Goods, Manufacturing, Real Estate, Education, etc.
- Employment Types: Full-time, Part-time, Contract, Internship, Freelance
- Company Names: Specific companies mentioned

**EDUCATIONAL INTELLIGENCE:**
- Degree Levels: High School Diploma, Certificate, Associate Degree, Bachelor's Degree, Master's Degree, MBA, Doctoral Degree (PhD), Professional Degree (JD, MD, etc.)
- School Ranking Tiers: Ivy League, Top 10, Top 25, Top 50, Top 100, Regional University, State University, Community College
- Major Categories: Computer Science/Technology, Engineering, Business Administration, Finance, Economics, Marketing, Liberal Arts, Natural Sciences, Healthcare/Medicine, Law, Education, etc.
- Education Context: Full-time programs, While working, Graduate school, Specific school names

**WORK STYLE & GEOGRAPHIC:**
- Work Styles: Remote work, Geographic mobility, International experience
- Locations: Major metro areas (New York, San Francisco Bay Area, Los Angeles, Chicago, Boston, Seattle, Atlanta), specific cities, states, countries
- Geographic Context: University locations (leveraging 7,737+ university database)

**TEMPORAL & CAREER PATTERNS:**
- Years: Specific years mentioned (2018, 2019, etc.)
- Exit Timing: When they left Chick-fil-A (ranges like "after 2020", "in 2018")
- Career Transitions: Industry changes, function changes, company size transitions
- Tenure Patterns: Years since leaving, duration at companies

**COMPENSATION & SUCCESS INDICATORS:**
- Salary Ranges: Based on estimated compensation analysis from atomic processing
- Success Indicators: Revenue responsibility, team size, leadership progression

**SPECIALIZATION & EXPERTISE:**
- Functional Expertise: Specific skill areas and specializations
- Industry Expertise: Deep knowledge in specific sectors
- Experience Types: Startup experience, Enterprise experience, Restaurant operations background

Be highly selective - only extract filters that are clearly and explicitly implied by the query. Don't over-interpret or add filters that aren't evident.

Format your response as:
Category: item1, item2
Category: item1, item2

Examples:
Query: "Senior AI engineers at Google in San Francisco"
Job Levels: Senior Level
Job Functions: Software Engineering, Data Science/Analytics  
Company Names: Google
Industries: Technology & Software
Locations: San Francisco Bay Area

Query: "MBA graduates who became startup founders"
Degree Levels: MBA
Job Levels: Founder/Owner
Company Sizes: Startup (1-50 employees)
Leadership Indicators: Leadership roles

Query: "People who left in 2020 and went into consulting"
Years: 2020
Job Functions: Consulting
Industries: Management Consulting

If no specific filters can be confidently extracted from the query, output "No specific filters detected".`,
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