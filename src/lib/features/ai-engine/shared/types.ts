// ============================================================================
// AI Engine (shared) — public types
// ============================================================================

import type { AiFeatureKey } from './config'

/**
 * Must be the authenticated subject id (e.g. `auth.user.id` from `authenticateFromRequest`).
 * Never pass ids from request body, query params, or other client-controlled input.
 */
export type TrustedUserId = string

export type AiModelKey = 'haiku' | 'sonnet' | 'opus' | 'mini'

export type AiUsage = {
	modelId: string
	feature: AiFeatureKey
	promptTokens: number
	completionTokens: number
	totalTokens: number
}

export type AiGenerateSuccess<T> = {
	data: T
	usage: AiUsage
}
