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
          content: `You are an AI assistant helping students explore alumni data. 
          
Your task is to generate 3 expanded search queries based on the original query. These should be 
variations or refinements that could help the user discover additional relevant alumni profiles.

For example:
- If the query is "AI researchers", you might suggest "Machine learning engineers at tech companies", "PhD graduates in artificial intelligence", "Alumni working on NLP at research labs"
- If the query is "Finance in NYC", suggest "Investment bankers at top Wall Street firms", "Alumni in private equity in Manhattan", "FinTech startup founders in New York"

Keep each suggestion concise (under 10 words if possible) and highly relevant to the original query.
Just provide the 3 expansions separated by "•" characters, with no numbering, introduction, or additional text.`,
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
    console.error('Expansion error:', error)
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}