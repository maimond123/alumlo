import OpenAI from 'openai';

/**
 * The chat-completions client, pointed at OpenRouter.
 *
 * OpenRouter speaks the OpenAI wire protocol, so the official SDK works
 * unchanged against it -- only the base URL and the key differ. Three route
 * files each constructed their own OpenAI client from the same environment
 * variable; they now share this one.
 *
 * Embeddings go through the same provider and key -- ingest/embed.py calls
 * the embeddings endpoint directly with baai/bge-m3 rather than through this
 * client, because ingest is Python.
 */
export const llm = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
  baseURL: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    // OpenRouter attributes requests to an app with these; both are optional.
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'https://github.com/maimond123/alumlo',
    'X-Title': 'Alumlo',
  },
});
