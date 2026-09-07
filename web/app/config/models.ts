/**
 * Models used by the search pipeline, served through OpenRouter.
 *
 * These were hardcoded at 12 call sites across two route files. Each name is
 * chosen for what that call actually does; override any of them by
 * environment without touching code.
 *
 * The 2025 system ran on gpt-4.1-mini and gpt-4o-mini. Those are gone from
 * this project, and the 2025 fine-tune
 * (ft:gpt-4.1-mini-2025-04-14:alumlo:1-alumlo:BzUQ9FHU) was deleted by OpenAI
 * along with its base model, so behaviour here is not identical to 2025.
 */
export const MODELS = {
  /**
   * Routes a query to standard / chronological / temporal. A four-way
   * decision with a short prompt, so the cheapest model that follows
   * instructions reliably wins.
   */
  CLASSIFY: process.env.ALUMLO_MODEL_CLASSIFY ?? 'z-ai/glm-4.5-air',

  /**
   * Natural language to structured search filters. The hard call, and the
   * one where mistakes are silent -- a wrong filter returns wrong results
   * rather than an error -- so this gets the strongest structured-output
   * model rather than the cheapest.
   */
  TRANSLATE: process.env.ALUMLO_MODEL_TRANSLATE ?? 'deepseek/deepseek-chat-v3.1',

  /**
   * The /learn assistant, which puts a JSON block of aggregate alumni data
   * in the system prompt. Chosen for context length (204k).
   */
  CHAT: process.env.ALUMLO_MODEL_CHAT ?? 'z-ai/glm-4.6',

  /** Fine-tuned translator. Null means callers take the prompt-only path. */
  FINE_TUNED: process.env.ALUMLO_MODEL_FINETUNED ?? null,
} as const;
