// ============================================================================

import { describe, expect, it } from 'vitest'

import { AiError } from '../../shared/_errors/aiErrors'
import { classifyAiError } from '../../shared/_utils/classifyAiError'

describe('classifyAiError', () => {
	it('passes through AiError', () => {
		const e = new AiError('RATE_LIMIT')
		expect(classifyAiError(e)).toBe(e)
	})

	it('maps AbortError to TIMEOUT', () => {
		const err = new Error('aborted')
		err.name = 'AbortError'
		const out = classifyAiError(err)
		expect(out.code).toBe('TIMEOUT')
	})
})
