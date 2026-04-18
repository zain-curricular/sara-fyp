// ============================================================================
// AI Engine — OpenAI provider (lazy; no throw at import time)
// ============================================================================

import { createOpenAI } from '@ai-sdk/openai'

import type { LanguageModel } from 'ai'

import { AI_MODELS } from '../config'
import { AiError } from '../_errors/aiErrors'

let cached: ReturnType<typeof createOpenAI> | null = null

/**
 * Returns the OpenAI provider factory, or `null` if `OPENAI_API_KEY` is unset.
 */
export function getOpenAIProvider(): ReturnType<typeof createOpenAI> | null {
	const key = process.env.OPENAI_API_KEY
	if (!key) {
		return null
	}
	if (!cached) {
		cached = createOpenAI({ apiKey: key })
	}
	return cached
}

export function getOpenAiMiniModel(): LanguageModel {
	const provider = getOpenAIProvider()
	if (!provider) {
		throw new AiError('MODEL_UNAVAILABLE', 'OPENAI_API_KEY missing')
	}
	return provider(AI_MODELS.openai.mini.id)
}
