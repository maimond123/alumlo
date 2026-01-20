import OpenAI from 'openai'

const openaiKey = process.env.OPENAI_API_KEY

// Skip OpenAI initialization if key not present
export const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null
