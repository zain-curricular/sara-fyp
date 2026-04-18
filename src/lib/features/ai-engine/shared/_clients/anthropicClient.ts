// ============================================================================
// AI Engine — Anthropic provider (lazy; no throw at import time)
// ============================================================================

import { createAnthropic } from '@ai-sdk/anthropic'

import type { LanguageModel } from 'ai'

import { AI_MODELS } from '../config'
import { AiError } from '../_errors/aiErrors'
import type { AiModelKey } from '../types'

let cached: ReturnType<typeof createAnthropic> | null = null

/**
 * Returns the Anthropic provider factory, or `null` if `ANTHROPIC_API_KEY` is unset.
 * Does not throw — callers validate before generating.
 */
export function getAnthropicProvider(): ReturnType<typeof createAnthropic> | null {
	const key = process.env.ANTHROPIC_API_KEY
	if (!key) {
		return null
	}
	if (!cached) {
		cached = createAnthropic({ apiKey: key })
	}
	return cached
}

/** Resolves a chat model for haiku | sonnet | opus keys. */
export function getAnthropicLanguageModel(model: Exclude<AiModelKey, 'mini'>): LanguageModel {
	const provider = getAnthropicProvider()
	if (!provider) {
		throw new AiError('MODEL_UNAVAILABLE', 'ANTHROPIC_API_KEY missing')
	}
	const cfg = AI_MODELS.anthropic[model]
	return provider(cfg.id)
}
