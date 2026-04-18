// ============================================================================

import type { LanguageModelUsage } from 'ai'

import type { AiFeatureKey } from '../config'
import type { AiUsage } from '../types'

export function toAiUsage(
	usage: LanguageModelUsage,
	modelId: string,
	feature: AiFeatureKey,
): AiUsage {
	const promptTokens = usage.inputTokens ?? 0
	const completionTokens = usage.outputTokens ?? 0
	const totalTokens = usage.totalTokens ?? promptTokens + completionTokens
	return {
		modelId,
		feature,
		promptTokens,
		completionTokens,
		totalTokens,
	}
}
