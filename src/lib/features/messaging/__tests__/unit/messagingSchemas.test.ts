// ============================================================================
// Unit tests — messaging Zod schemas
// ============================================================================

import { describe, it, expect } from 'vitest'

import { sendMessageBodySchema } from '../../schemas'

describe('sendMessageBodySchema', () => {
	it('rejects content over 5000 chars', () => {
		const long = 'a'.repeat(5001)
		const r = sendMessageBodySchema.safeParse({ content: long })
		expect(r.success).toBe(false)
	})

	it('accepts content at 5000 chars', () => {
		const ok = 'a'.repeat(5000)
		const r = sendMessageBodySchema.safeParse({ content: ok })
		expect(r.success).toBe(true)
	})
})
