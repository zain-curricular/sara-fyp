// ============================================================================
// AI Engine — bounded text generation with rate limit, timeout, retries
// ============================================================================

import { generateText } from 'ai'

import { AI_MAX_RETRIES, AI_TIMEOUT_MS, type AiFeatureKey } from '../config'
import { AiError } from '../_errors/aiErrors'
import type { AiGenerateSuccess, AiModelKey, TrustedUserId } from '../types'
import { resolveLanguageModel } from './resolveModel'
import { assertAiRateLimit } from './rateLimit'
import { classifyAiError } from './classifyAiError'
import { sleep } from './sleep'
import { trackAiUsage } from './trackUsage'
import { toAiUsage } from './usageFromLanguageModel'
import { withAbortTimeout } from './withTimeout'

/**
 * Free-form text with `maxOutputTokens` from model config. Throws `AiError` after retries exhausted.
 *
 * @param input.userId — Must be {@link TrustedUserId} (authenticated caller only).
 */
export async function generateTextBounded(input: {
	prompt: string
	system?: string
	model: AiModelKey
	feature: AiFeatureKey
	userId: TrustedUserId
}): Promise<AiGenerateSuccess<string>> {
	await assertAiRateLimit(input.userId, input.feature)
	const { model, modelId, maxOutputTokens } = resolveLanguageModel(input.model)

	let lastErr: unknown
	for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
		try {
			const result = await withAbortTimeout(AI_TIMEOUT_MS, (signal) =>
				generateText({
					model,
					system: input.system,
					prompt: input.prompt,
					maxOutputTokens,
					abortSignal: signal,
					maxRetries: 0,
				}),
			)
			const usage = toAiUsage(result.totalUsage ?? result.usage, modelId, input.feature)
			await trackAiUsage(usage)
			return { data: result.text, usage }
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
