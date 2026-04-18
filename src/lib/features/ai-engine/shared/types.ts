// ============================================================================
// AI Engine (shared) — public types
// ============================================================================

import type { AiFeatureKey } from './config'

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
