import OpenAI from 'openai'

const openaiKey = process.env.OPENAI_API_KEY

if (!openaiKey) {
  throw new Error('OpenAI API key must be provided as an environment variable.')
}

export const openai = new OpenAI({
  apiKey: openaiKey,
})
