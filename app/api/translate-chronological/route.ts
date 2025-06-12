import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface ChronologicalFilters {
  // Experience-based filters
  min_years_in_industry?: number;
  min_years_in_function?: number;
  min_years_at_company_type?: number;
  career_progression_pattern?: string; // e.g., "individual_contributor_to_management"
  
  // Education-based filters
  degree_level_progression?: string[]; // e.g., ["Bachelor's", "Master's"]
  education_industry_alignment?: boolean; // Education field matches career industry
  
  // Timeline-based filters
  gap_tolerance?: number; // Max acceptable gaps in months
  concurrent_activities?: boolean; // Working while studying, etc.
  
  // Specific patterns
  industry_transitions?: string[]; // Pattern of industry changes
  company_size_progression?: string[]; // Pattern of company size changes
  geographic_mobility?: boolean; // Moved locations for career
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    
    console.log('Translating natural language to chronological filters:', query);
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0, // For consistent translations
      messages: [
        {
          role: 'system',
          content: `You are a natural language translator for chronological career search filters. Your job is to extract specific career progression parameters from natural language queries.

**FILTER CATEGORIES:**

1. **EXPERIENCE-BASED FILTERS:**
   - min_years_in_industry: Minimum years of experience in a specific industry
   - min_years_in_function: Minimum years in a specific job function (e.g., engineering, sales)
   - min_years_at_company_type: Minimum years at specific company types (startup, enterprise)
   - career_progression_pattern: Specific career advancement patterns

2. **EDUCATION-BASED FILTERS:**
   - degree_level_progression: Array of education levels in progression order
   - education_industry_alignment: Whether education field should match career industry

3. **TIMELINE-BASED FILTERS:**
   - gap_tolerance: Maximum acceptable career gaps in months
   - concurrent_activities: Whether person worked while studying

4. **PATTERN-BASED FILTERS:**
   - industry_transitions: Array of industry change patterns
   - company_size_progression: Array of company size progression patterns
   - geographic_mobility: Whether person moved locations for career opportunities

**EXTRACTION RULES:**

- Extract numeric values for experience requirements (e.g., "10+ years" → 10)
- Identify career progression patterns (e.g., "IC to management" → "individual_contributor_to_management")
- Detect education requirements and progressions
- Identify mobility and transition patterns
- Set reasonable defaults for timeline tolerances

**CAREER PROGRESSION PATTERNS:**
- "individual_contributor_to_management"
- "entry_level_to_senior"
- "startup_to_enterprise"
- "enterprise_to_startup"
- "technical_to_leadership"
- "specialist_to_generalist"
- "rapid_advancement"
- "steady_progression"

**COMPANY SIZE PROGRESSIONS:**
- ["startup", "medium", "large"] - scaling up experience
- ["large", "medium", "startup"] - scaling down experience
- ["startup"] - startup-only experience
- ["enterprise"] - enterprise-only experience

**EXAMPLES:**

Query: "People with 10+ years of engineering experience who became managers"
{
  "min_years_in_function": 10,
  "career_progression_pattern": "individual_contributor_to_management",
  "gap_tolerance": 6
}

Query: "Experienced professionals who moved from big tech to startups"
{
  "min_years_in_industry": 5,
  "company_size_progression": ["large", "startup"],
  "industry_transitions": ["technology"],
  "gap_tolerance": 12
}

Query: "Alumni with MBA degrees who have strong career progression"
{
  "degree_level_progression": ["Bachelor's", "Master's"],
  "career_progression_pattern": "steady_progression",
  "education_industry_alignment": false,
  "gap_tolerance": 6
}

Query: "People who worked while getting their degree and then moved into leadership"
{
  "concurrent_activities": true,
  "career_progression_pattern": "technical_to_leadership",
  "gap_tolerance": 3
}

Query: "Senior professionals with 15+ years experience in multiple industries"
{
  "min_years_in_industry": 15,
  "industry_transitions": ["multiple"],
  "career_progression_pattern": "specialist_to_generalist",
  "gap_tolerance": 12
}

Query: "People who relocated for better career opportunities"
{
  "geographic_mobility": true,
  "career_progression_pattern": "rapid_advancement",
  "gap_tolerance": 6
}

**OUTPUT FORMAT:**
Return only a JSON object with the extracted filters. Include only filters that are clearly indicated by the query. Use null for unspecified filters.

If no chronological patterns are detected, return:
{
  "gap_tolerance": 6
}`,
        },
        {
          role: 'user',
          content: query
        },
      ],
    });

    const filtersText = response.choices[0]?.message?.content;
    
    if (!filtersText) {
      throw new Error('No translation response received');
    }

    // Parse the JSON response
    let chronologicalFilters: ChronologicalFilters;
    try {
      chronologicalFilters = JSON.parse(filtersText);
    } catch (parseError) {
      console.error('Failed to parse chronological filters JSON:', filtersText);
      // Default to basic filters if parsing fails
      chronologicalFilters = { gap_tolerance: 6 };
    }

    console.log('Chronological filters translation result:', chronologicalFilters);
    
    return NextResponse.json(chronologicalFilters);
  } catch (error: any) {
    console.error('Chronological filters translation error:', error);
    
    // Return basic filters as fallback
    return NextResponse.json({ 
      gap_tolerance: 6
    });
  }
} 