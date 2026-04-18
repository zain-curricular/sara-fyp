// ============================================================================
// Description Generator — rate limit contract (same bucket as generateTextBounded)
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest'

import { AiError } from '../../shared/_errors/aiErrors'
import { assertAiRateLimit, _clearAiInMemoryRateLimitForTests } from '../../shared/_utils/rateLimit'
import { AI_RATE_LIMITS } from '../../shared/config'

describe('Description Generator — rate limit', () => {
	beforeEach(() => {
		_clearAiInMemoryRateLimitForTests()
	})

	it('uses description_generator feature key with configured daily budget', async () => {
		expect(AI_RATE_LIMITS.description_generator.requests).toBe(10)
		const userId = 'description-generator-rl-user'
		for (let i = 0; i < 10; i++) {
			await assertAiRateLimit(userId, 'description_generator')
		}
		await expect(assertAiRateLimit(userId, 'description_generator')).rejects.toThrow(AiError)
		await expect(assertAiRateLimit(userId, 'description_generator')).rejects.toMatchObject({
			code: 'RATE_LIMIT',
		})
	})
})
