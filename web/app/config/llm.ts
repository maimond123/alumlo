import OpenAI from 'openai';

/**
 * The chat-completions client, pointed at OpenRouter.
 *
 * OpenRouter speaks the OpenAI wire protocol, so the official SDK works
 * unchanged against it -- only the base URL and the key differ. Three route
 * files each constructed their own OpenAI client from the same environment
 * variable; they now share this one.
 *
 * OpenRouter does not offer a usable embeddings endpoint, so nothing here
 * covers embeddings. Those are generated locally by ingest/embed.py using
 * BGE-M3, which needs no API and cannot rate-limit or lapse.
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
