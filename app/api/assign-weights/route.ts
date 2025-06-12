import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface WeightAssignment {
  career_quality: number;
  education_quality: number;
  timeline_precision: number;
  filter_specificity: number;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    
    console.log('Assigning chronological weights for query:', query);
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      temperature: 0, // For consistent weight assignments
      messages: [
        {
          role: 'system',
          content: `You are analyzing a chronological career search query to determine what the user cares most about.

Assign weights (0-1, must sum to 1.0) across these dimensions:

1. CAREER_QUALITY (combines experience + progression + leadership)
   - Total years of experience
   - Job level advancement (entry → mid → senior → management)
   - Leadership roles and responsibilities
   - Industry expertise and specialization

2. EDUCATION_QUALITY (degree advancement + institution prestige)
   - Degree level progression (high school → bachelor's → master's → PhD)
   - Institution reputation and selectivity
   - Field of study relevance
   - Academic achievements

3. TIMELINE_PRECISION (sequence patterns + temporal accuracy)
   - How closely their timeline matches requested pattern
   - Gap timing between career and education transitions
   - Concurrent activities (working while studying)
   - Geographic mobility for opportunities

4. FILTER_SPECIFICITY (exact matches to user criteria)
   - Specific companies mentioned in query
   - Specific schools/institutions mentioned
   - Specific job titles or industries
   - Location requirements

WEIGHT ASSIGNMENT EXAMPLES:

Query: "Find people with 10+ years experience"
Response: {"career_quality": 0.7, "education_quality": 0.1, "timeline_precision": 0.1, "filter_specificity": 0.1}

Query: "People who worked at Google then went to Stanford"  
Response: {"career_quality": 0.2, "education_quality": 0.2, "timeline_precision": 0.3, "filter_specificity": 0.3}

Query: "Alumni who worked while studying"
Response: {"career_quality": 0.2, "education_quality": 0.2, "timeline_precision": 0.6, "filter_specificity": 0.0}

Query: "Management track people who got MBA degrees"
Response: {"career_quality": 0.4, "education_quality": 0.3, "timeline_precision": 0.2, "filter_specificity": 0.1}

Query: "Experienced technology leaders"
Response: {"career_quality": 0.6, "education_quality": 0.1, "timeline_precision": 0.1, "filter_specificity": 0.2}

Query: "People who worked at Apple and Microsoft"
Response: {"career_quality": 0.25, "education_quality": 0.15, "timeline_precision": 0.1, "filter_specificity": 0.5}

Return ONLY the JSON object with the four weights. The weights must sum to 1.0.`,
        },
        {
          role: 'user',
          content: query
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let weights: WeightAssignment;
    try {
      const parsed = JSON.parse(content);
      weights = validateWeights(parsed);
    } catch (parseError) {
      console.error('Failed to parse LLM response:', content);
      weights = getDefaultWeights();
    }

    return new Response(JSON.stringify(weights), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Weight assignment error:', error);
    
    // Return default weights on error
    const defaultWeights = getDefaultWeights();
    return new Response(JSON.stringify(defaultWeights), {
      status: 200, // Return 200 with defaults rather than error
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function validateWeights(response: any): WeightAssignment {
  let weights = response;
  
  // If response is wrapped in a weights object, extract it
  if (response.weights) {
    weights = response.weights;
  }
  
  // Ensure all required fields exist
  const requiredFields = ['career_quality', 'education_quality', 'timeline_precision', 'filter_specificity'];
  for (const field of requiredFields) {
    if (typeof weights[field] !== 'number') {
      console.warn(`Missing or invalid weight field: ${field}`);
      return getDefaultWeights();
    }
  }
  
  // Ensure weights sum to 1.0
  const sum = weights.career_quality + weights.education_quality + weights.timeline_precision + weights.filter_specificity;
  if (Math.abs(sum - 1.0) > 0.01) {
    // Normalize if close to 1.0
    const normalizedWeights = {
      career_quality: weights.career_quality / sum,
      education_quality: weights.education_quality / sum,
      timeline_precision: weights.timeline_precision / sum,
      filter_specificity: weights.filter_specificity / sum
    };
    return normalizedWeights;
  }
  
  // Ensure no negative weights
  const validatedWeights = {
    career_quality: Math.max(0, weights.career_quality),
    education_quality: Math.max(0, weights.education_quality),
    timeline_precision: Math.max(0, weights.timeline_precision),
    filter_specificity: Math.max(0, weights.filter_specificity)
  };
  
  return validatedWeights;
}

function getDefaultWeights(): WeightAssignment {
  return {
    career_quality: 0.4,
    education_quality: 0.25,
    timeline_precision: 0.25,
    filter_specificity: 0.1
  };
} 