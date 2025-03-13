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

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export async function POST(req: Request) {
  const { messages, chartId, chartType, chartTitle, chartData } = await req.json()

  try {
    // Use the provided chart data if available, otherwise fall back to fetching it
    let chart: Chart;
    let formattedData: string;
    
    if (chartData) {
      // Use the data provided from the client
      chart = {
        id: chartId,
        type: chartType,
        title: chartTitle,
        data: chartData,
        description: `${chartTitle} visualization`
      };
      
      // Format the data for better readability
      formattedData = chartData.map((item: ChartItem) => 
        `${item.name}: ${item.value}${chartType === 'pie' || chartType === 'industry' ? '%' : ''}`
      ).join('\n');
    } else {
      // Chart not found in the expected location
      return new Response(JSON.stringify({ error: 'Chart not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Use the OpenAI client directly instead of callOpenAI
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
    })

    // Create a new stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              // Send the content chunk
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`))
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

