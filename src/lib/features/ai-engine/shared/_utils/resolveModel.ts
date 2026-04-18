// ============================================================================
// AI Engine — map logical model key → LanguageModel + max output tokens
// ============================================================================

import type { LanguageModel } from 'ai'

import { AI_MODELS } from '../config'
import { AiError } from '../_errors/aiErrors'
import type { AiModelKey } from '../types'
import { getAnthropicLanguageModel, getAnthropicProvider } from '../_clients/anthropicClient'
import { getOpenAIProvider, getOpenAiMiniModel } from '../_clients/openaiClient'

export type ResolvedModel = {
	model: LanguageModel
	modelId: string
	maxOutputTokens: number
}

export function resolveLanguageModel(model: AiModelKey): ResolvedModel {
	if (model === 'mini') {
		if (!getOpenAIProvider()) {
			throw new AiError('MODEL_UNAVAILABLE', 'OPENAI_API_KEY missing')
		}
		const m = getOpenAiMiniModel()
		return {
			model: m,
			modelId: AI_MODELS.openai.mini.id,
			maxOutputTokens: AI_MODELS.openai.mini.max_tokens,
		}
	}

	if (!getAnthropicProvider()) {
		throw new AiError('MODEL_UNAVAILABLE', 'ANTHROPIC_API_KEY missing')
	}

	const m = getAnthropicLanguageModel(model)
	const cfg = AI_MODELS.anthropic[model]
	return {
		model: m,
		modelId: cfg.id,
		maxOutputTokens: cfg.max_tokens,
	}
}
