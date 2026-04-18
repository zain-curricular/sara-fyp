// ============================================================================
// Unit tests — admin-panel query/body schemas
// ============================================================================

import { describe, it, expect } from 'vitest'

import {
	adminModerationReportsQuerySchema,
	adminResolveReportBodySchema,
	adminAnalyticsWindowQuerySchema,
} from '@/lib/features/admin-panel/schemas'

describe('adminModerationReportsQuerySchema', () => {
	it('defaults limit and offset', () => {
		const r = adminModerationReportsQuerySchema.safeParse({})
		expect(r.success).toBe(true)
		if (r.success) {
			expect(r.data.limit).toBe(20)
			expect(r.data.offset).toBe(0)
		}
	})
})

describe('adminAnalyticsWindowQuerySchema', () => {
	it('accepts 7', () => {
		const r = adminAnalyticsWindowQuerySchema.safeParse({ days: '7' })
		expect(r.success).toBe(true)
		if (r.success) expect(r.data.days).toBe(7)
	})

	it('rejects invalid days', () => {
		const r = adminAnalyticsWindowQuerySchema.safeParse({ days: 5 })
		expect(r.success).toBe(false)
	})
})

describe('adminResolveReportBodySchema', () => {
	it('requires strict shape', () => {
		const r = adminResolveReportBodySchema.safeParse({ status: 'resolved', extra: 1 })
		expect(r.success).toBe(false)
	})
})
