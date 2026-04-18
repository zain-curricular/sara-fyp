// ============================================================================
// Rating Engine — rate limit contract (same bucket as generateStructured)
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest'

import { AiError } from '../../shared/_errors/aiErrors'
import { assertAiRateLimit, _clearAiInMemoryRateLimitForTests } from '../../shared/_utils/rateLimit'
import { AI_RATE_LIMITS } from '../../shared/config'

describe('Rating Engine — rate limit', () => {
	beforeEach(() => {
		_clearAiInMemoryRateLimitForTests()
	})

	it('uses rating_engine feature key with configured daily budget', async () => {
		expect(AI_RATE_LIMITS.rating_engine.requests).toBe(5)
		const userId = 'rating-engine-rl-user'
		for (let i = 0; i < 5; i++) {
			await assertAiRateLimit(userId, 'rating_engine')
		}
		await expect(assertAiRateLimit(userId, 'rating_engine')).rejects.toThrow(AiError)
		await expect(assertAiRateLimit(userId, 'rating_engine')).rejects.toMatchObject({
			code: 'RATE_LIMIT',
		})
	})
})
