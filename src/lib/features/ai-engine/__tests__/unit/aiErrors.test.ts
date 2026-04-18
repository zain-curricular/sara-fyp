// ============================================================================

import { describe, expect, it } from 'vitest'

import { AiError } from '../../shared/_errors/aiErrors'
import { aiErrorToHttp } from '../../shared/_errors/aiHttp'

describe('AiError', () => {
	it('isAiError narrows', () => {
		expect(AiError.isAiError(new AiError('RATE_LIMIT'))).toBe(true)
		expect(AiError.isAiError(new Error('x'))).toBe(false)
	})
})

describe('aiErrorToHttp', () => {
	it('maps known codes', () => {
		expect(aiErrorToHttp(new AiError('RATE_LIMIT')).status).toBe(429)
		expect(aiErrorToHttp(new AiError('MODERATION_BLOCKED')).status).toBe(400)
		expect(aiErrorToHttp(new AiError('TIMEOUT')).status).toBe(504)
		expect(aiErrorToHttp(new AiError('MODEL_UNAVAILABLE')).status).toBe(503)
		expect(aiErrorToHttp(new AiError('INVALID_OUTPUT')).status).toBe(502)
		expect(aiErrorToHttp(new AiError('UNKNOWN')).status).toBe(500)
	})

	it('maps unknown errors to 500', () => {
		expect(aiErrorToHttp(new Error('oops')).status).toBe(500)
	})
})
