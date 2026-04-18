// ============================================================================
// AI Engine (shared) — model IDs, timeouts, per-feature rate budgets
// ============================================================================

export const AI_MODELS = {
	anthropic: {
		haiku: { id: 'claude-haiku-4-5', max_tokens: 2000 },
		sonnet: { id: 'claude-sonnet-4-6', max_tokens: 4000 },
		opus: { id: 'claude-opus-4-7', max_tokens: 8000 },
	},
	openai: {
		mini: { id: 'gpt-4o-mini', max_tokens: 2000 },
	},
} as const

export const AI_TIMEOUT_MS = 30_000

/** OpenAI moderation HTTP call — bounded so routes cannot hang indefinitely. */
export const AI_MODERATION_TIMEOUT_MS = 15_000

/** Retries after the first attempt (total attempts = 1 + AI_MAX_RETRIES). */
export const AI_MAX_RETRIES = 2

/** Max completion tokens for listing descriptions (~300 words). */
export const AI_DESCRIPTION_MAX_OUTPUT_TOKENS = 400

export const AI_RATE_LIMITS = {
	description_generator: { requests: 10, window: '1d' as const },
	rating_engine: { requests: 5, window: '1d' as const },
	recommendations: { requests: 100, window: '1h' as const },
} as const

export type AiFeatureKey = keyof typeof AI_RATE_LIMITS
