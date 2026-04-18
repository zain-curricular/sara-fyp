// ============================================================================

import { describe, expect, it, beforeEach } from 'vitest'

import { AiError } from '../../shared/_errors/aiErrors'
import { assertAiRateLimit, _clearAiInMemoryRateLimitForTests } from '../../shared/_utils/rateLimit'

describe('assertAiRateLimit (in-memory)', () => {
	beforeEach(() => {
		_clearAiInMemoryRateLimitForTests()
	})

	it('allows within budget then throws RATE_LIMIT', async () => {
		const userId = 'user-1'
		for (let i = 0; i < 10; i++) {
			await assertAiRateLimit(userId, 'description_generator')
		}
		await expect(assertAiRateLimit(userId, 'description_generator')).rejects.toThrow(AiError)
		await expect(assertAiRateLimit(userId, 'description_generator')).rejects.toMatchObject({
			code: 'RATE_LIMIT',
		})
	})

	it('isolates features', async () => {
		const userId = 'user-2'
		for (let i = 0; i < 5; i++) {
			await assertAiRateLimit(userId, 'rating_engine')
		}
		await expect(assertAiRateLimit(userId, 'rating_engine')).rejects.toMatchObject({ code: 'RATE_LIMIT' })
		await assertAiRateLimit(userId, 'description_generator')
	})
})
