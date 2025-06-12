import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    
    console.log('Classifying query type for optimal search method:', query);
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0, // For consistent classification
      messages: [
        {
          role: 'system',
          content: `You are a query classification system for an alumni search database. Your job is to determine which search method will best serve the user's query.

**SEARCH TYPES:**

1. **TEMPORAL SEARCH** - For queries with specific dates, years, or time-based sequences
   - Specific years (e.g., "2018", "2019-2021", "after 2020")
   - Time-based sequences (e.g., "then became", "later moved to", "after leaving")
   - Exit timing references (e.g., "left in", "graduated in", "departed")
   - Sequential patterns with dates (e.g., "started in 2018, then moved to Google in 2020")

2. **CHRONOLOGICAL SEARCH** - For queries about career progression patterns and quality (no specific dates needed)
   - Career progression quality (e.g., "strong career progression", "rapid advancement")
   - Experience depth (e.g., "experienced", "10+ years", "senior professionals")
   - Career transitions (e.g., "moved from tech to finance", "became entrepreneurs")
   - Leadership development (e.g., "went from IC to management", "became executives")
   - Industry expertise building (e.g., "deep expertise in", "specialists in")

3. **STANDARD SEARCH** - For basic semantic matching without time or progression focus
   - Simple role/title searches (e.g., "software engineers", "marketing managers")
   - Company-based searches (e.g., "people at Google", "former Microsoft employees")
   - Location-based searches (e.g., "alumni in San Francisco")
   - Industry-based searches (e.g., "people in healthcare", "finance professionals")
   - Basic skill/background searches (e.g., "computer science graduates")

**CLASSIFICATION RULES:**

- If query contains specific years/dates OR temporal sequences → **TEMPORAL**
- If query focuses on career progression/experience quality (no specific dates) → **CHRONOLOGICAL**  
- If query is basic semantic matching → **STANDARD**

**OUTPUT FORMAT:**

For TEMPORAL queries:
{
  "type": "temporal",
  "temporal_elements": {
    "years": [array of years as numbers],
    "functions": [array of job functions/roles as strings],
    "sequence_detected": boolean,
    "exit_years": [array of exit years as numbers]
  }
}

For CHRONOLOGICAL queries:
{
  "type": "chronological",
  "progression_elements": {
    "experience_focus": boolean,
    "progression_pattern": string,
    "career_quality_focus": boolean,
    "leadership_development": boolean
  }
}

For STANDARD queries:
{
  "type": "standard"
}

**EXAMPLES:**

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

Query: "Experienced technology leaders with strong career progression"
{
  "type": "chronological",
  "progression_elements": {
    "experience_focus": true,
    "progression_pattern": "leadership_development",
    "career_quality_focus": true,
    "leadership_development": true
  }
}

Query: "Software engineers in San Francisco"
{
  "type": "standard"
}

Query: "People who worked here 2020-2022 then moved to startups"
{
  "type": "temporal",
  "temporal_elements": {
    "years": [2020, 2021, 2022],
    "functions": ["startup"],
    "sequence_detected": true,
    "exit_years": [2022]
  }
}

Query: "Alumni who transitioned from individual contributors to management roles"
{
  "type": "chronological",
  "progression_elements": {
    "experience_focus": false,
    "progression_pattern": "ic_to_management",
    "career_quality_focus": true,
    "leadership_development": true
  }
}

Query: "Marketing professionals"
{
  "type": "standard"
}

Query: "People with 10+ years of experience who became entrepreneurs"
{
  "type": "chronological",
  "progression_elements": {
    "experience_focus": true,
    "progression_pattern": "entrepreneurship",
    "career_quality_focus": true,
    "leadership_development": true
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