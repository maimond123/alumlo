import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export async function POST(req: Request) {
  const { query } = await req.json()

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant helping to extract search filters from natural language queries for an alumni database.

The database has these filter categories:
- Industries (tech, finance, healthcare, consulting, etc.)
- Roles/Titles (engineer, CEO, analyst, researcher, etc.)
- Companies (Google, Microsoft, Amazon, etc.)
- Locations (New York, San Francisco, international, etc.)
- Education (MBA, PhD, graduate school, etc.)

Analyze the user's query and extract relevant filters in this format:
Categories: item1, item2
Categories: item1, item2

For example, if the query is "AI engineers at Google in New York", output:
Industries: Tech, AI
Roles: Engineer
Companies: Google
Locations: New York

If you can't identify filters for a category, omit that category entirely.
Don't invent filters that aren't clearly implied by the query.
If no filters can be confidently extracted, output "No specific filters detected".`,
        },
        {
          role: 'user',
          content: query
        },
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
    console.error('Filter extraction error:', error)
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}