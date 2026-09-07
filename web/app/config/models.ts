/**
 * Model names used by the search pipeline.
 *
 * These were hardcoded at 12 call sites across two route files. The defaults
 * below are the models the 2025 system actually ran on, so the original
 * behaviour stays documented; set the environment variables to run against
 * whatever your OpenAI project can currently reach.
 *
 * The 2025 fine-tune (ft:gpt-4.1-mini-2025-04-14:alumlo:1-alumlo:BzUQ9FHU)
 * was deleted by OpenAI along with its base model. FINE_TUNED is null unless
 * a replacement is trained and configured, and every caller falls back to the
 * prompt-only path when it is null.
 */
export const MODELS = {
  /** Routes a query to standard / chronological / temporal. */
  CLASSIFY: process.env.ALUMLO_MODEL_CLASSIFY ?? 'gpt-4.1-mini',

  /** Translates natural language into structured search filters. */
  TRANSLATE: process.env.ALUMLO_MODEL_TRANSLATE ?? 'gpt-4o-mini',

  /** The conversational /learn endpoint. */
  CHAT: process.env.ALUMLO_MODEL_CHAT ?? 'gpt-4o-mini',

  /** Fine-tuned translator. Null means use the prompt-only path. */
  FINE_TUNED: process.env.ALUMLO_MODEL_FINETUNED ?? null,
} as const;
