// ============================================================================
// AI Engine — structured generation (Zod) with rate limit, timeout, retries
// ============================================================================

import { generateObject } from 'ai'
import type { z } from 'zod'

import { AI_MAX_RETRIES, AI_TIMEOUT_MS, type AiFeatureKey } from '../config'
import { AiError } from '../_errors/aiErrors'
import type { AiGenerateSuccess, AiModelKey } from '../types'
import { resolveLanguageModel } from './resolveModel'
import { assertAiRateLimit } from './rateLimit'
import { classifyAiError } from './classifyAiError'
import { sleep } from './sleep'
import { trackAiUsage } from './trackUsage'
import { toAiUsage } from './usageFromLanguageModel'
import { withAbortTimeout } from './withTimeout'

/**
 * Generates a typed object via `generateObject`. On failure after retries, throws `AiError`.
 */
export async function generateStructured<T>(input: {
	schema: z.ZodType<T>
	prompt: string
	system?: string
	model: AiModelKey
	feature: AiFeatureKey
	userId: string
}): Promise<AiGenerateSuccess<T>> {
	await assertAiRateLimit(input.userId, input.feature)
	const { model, modelId, maxOutputTokens } = resolveLanguageModel(input.model)

	let lastErr: unknown
	for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
		try {
			const result = await withAbortTimeout(AI_TIMEOUT_MS, (signal) =>
				generateObject({
					model,
					schema: input.schema,
					system: input.system,
					prompt: input.prompt,
					maxOutputTokens,
					abortSignal: signal,
					maxRetries: 0,
				}),
			)
			const usage = toAiUsage(result.usage, modelId, input.feature)
			await trackAiUsage(usage)
			return { data: result.object, usage }
		} catch (e) {
			lastErr = e
			if (e instanceof AiError && e.code === 'RATE_LIMIT') {
				throw e
			}
			if (attempt < AI_MAX_RETRIES) {
				await sleep(100 * 2 ** attempt)
			}
		}
	}
	throw classifyAiError(lastErr)
}
