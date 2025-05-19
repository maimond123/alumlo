import OpenAI from 'openai'

// Define an interface for the chart data structure
interface ChartItem {
  name: string;
  value: number;
}

interface Chart {
  id: string;
  type: string;
  title: string;
  data: ChartItem[];
  description: string;
}

// Define alumni statistics
const alumniStatistics = {
  salary_premium: {
    name: "Salary Premium",
    value: "40% higher than average population",
    description: "Alumni from our institution earn salaries that are 40% higher than the average population, reflecting the value of our educational programs.",
    insight: "This significant salary premium can be marketed to prospective students as evidence of strong ROI on their educational investment and used in fundraising campaigns."
  },
  industry_leadership: {
    name: "Industry Leadership",
    value: "28%",
    description: "28% of our alumni reach executive positions within 10 years of graduation, demonstrating exceptional career advancement.",
    insight: "This high leadership rate positions the school as a training ground for industry leaders and can be highlighted in corporate partnership initiatives."
  },
  geographic_influence: {
    name: "Geographic Influence",
    value: "35+ countries",
    description: "Our alumni have established presence in over 35 countries worldwide, creating global networking opportunities.",
    insight: "This global footprint can be leveraged for international student recruitment and developing global partnerships with organizations seeking diverse talent."
  },
  career_acceleration: {
    name: "Career Acceleration",
    value: "2.3 years vs 4.1 years industry average",
    description: "Alumni change roles/companies every 2.3 years compared to the industry average of 4.1 years, indicating faster career growth and promotion rates.",
    insight: "This rapid career advancement statistic demonstrates the marketability and adaptability of graduates in competitive job markets."
  },
  entrepreneurship_impact: {
    name: "Entrepreneurship Impact",
    value: "17% with 3x higher success rate",
    description: "17% of alumni have founded companies, with a success rate 3 times higher than average startups.",
    insight: "This entrepreneurial success can be used to attract innovation-minded students and develop stronger incubator/accelerator programs at the institution."
  }
};

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chartId, chartType, chartTitle, chartData, message, schoolName, history } = body;

    // Handle chart analysis request
    if (chartId && chartData) {
      return handleChartAnalysis(chartId, chartType, chartTitle, chartData, history || []);
    }
    
    // Handle Learn mode chat request
    if (message) {
      return handleLearnModeChat(message, schoolName, history || []);
    }

    // If neither type of request is properly formatted
    return new Response(JSON.stringify({ error: 'Invalid request parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle chart analysis requests
async function handleChartAnalysis(chartId: string, chartType: string, chartTitle: string, chartData: ChartItem[], messages: any[]) {
  // Create chart object
  const chart = {
    id: chartId,
    type: chartType,
    title: chartTitle,
    data: chartData,
    description: `${chartTitle} visualization`
  };
  
  // Format the data for better readability
  const formattedData = chartData.map((item: ChartItem) => 
    `${item.name}: ${item.value}${chartType === 'pie' || chartType === 'industry' ? '%' : ''}`
  ).join('\n');

  // Use the OpenAI client for chart analysis
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant specialized in analyzing data visualizations for AlumIntel, a platform that helps schools track and analyze alumni data. 
        
You are currently analyzing chart ${chartId}:
- Chart Type: ${chart.type}
- Chart Title: ${chart.title}
- Description: ${chart.description}
- Data Overview: ${chart.description}

The actual data values are:
${formattedData}

Provide insights, answer questions, and help users understand this specific data. Keep responses concise and focused on analyzing these exact values. For percentage values, make sure to reference them as percentages in your analysis.`,
      },
      ...messages,
    ],
  });

  return createStreamResponse(response);
}

// Handle Learn mode chat requests
async function handleLearnModeChat(message: string, schoolName: string, history: any[]) {
  // Format the alumni statistics for the prompt
  const statsFormatted = Object.values(alumniStatistics)
    .map(stat => `${stat.name}: ${stat.value}
Description: ${stat.description}
Marketing Insight: ${stat.insight}`)
    .join('\n\n');

  // Convert history to OpenAI format
  const formattedHistory = history.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // Use the OpenAI client for learn mode chat
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages: [
      {
        role: 'system',
        content: `You are AlumIntel's AI assistant specializing in alumni data analysis. You help users understand alumni statistics and derive marketing insights from them.

You have access to the following statistics about ${schoolName} alumni:

${statsFormatted}

When responding to questions:
1. Reference relevant statistics from the data above
2. Explain what the statistics mean in practice
3. Provide specific marketing insights or recommendations when relevant
4. If asked about statistics you don't have data for, acknowledge the lack of data but suggest how such data might be valuable
5. Keep responses informative yet conversational
6. Maintain a positive, professional tone

Your goal is to help users understand how alumni data can be leveraged for marketing, recruitment, and institutional advancement.`
      },
      ...formattedHistory,
      {
        role: 'user',
        content: message
      }
    ],
  });

  return createStreamResponse(response);
}

// Create a streaming response from OpenAI
function createStreamResponse(response: any) {
  // Create a new stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            // Send the content chunk
            controller.enqueue(new TextEncoder().encode(content));
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
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

