// ============================================================================
// Unit tests — notifications Zod schemas
// ============================================================================

import { describe, expect, it } from 'vitest'

import { notificationsMeQuerySchema } from '../../schemas'

describe('notificationsMeQuerySchema', () => {
	it('defaults page, limit, unread_first', () => {
		const r = notificationsMeQuerySchema.safeParse({})
		expect(r.success).toBe(true)
		if (r.success) {
			expect(r.data.page).toBe(1)
			expect(r.data.limit).toBe(20)
			expect(r.data.unread_first).toBe(false)
		}
	})

	it('parses unread_first=true', () => {
		const r = notificationsMeQuerySchema.safeParse({ unread_first: 'true' })
		expect(r.success).toBe(true)
		if (r.success) {
			expect(r.data.unread_first).toBe(true)
		}
	})

	it('rejects invalid unread_first', () => {
		const r = notificationsMeQuerySchema.safeParse({ unread_first: 'maybe' })
		expect(r.success).toBe(false)
	})
})
