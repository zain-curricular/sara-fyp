// ============================================================================
// Unit tests — recommendations query schemas
// ============================================================================

import { describe, it, expect } from 'vitest'

import {
	similarListingsQuerySchema,
	trendingQuerySchema,
	forMeQuerySchema,
} from '@/lib/features/recommendations/schemas'
import { RECOMMENDATIONS_MAX_LIMIT } from '@/lib/features/recommendations/config'

describe('similarListingsQuerySchema', () => {
	it('defaults limit to 12', () => {
		const r = similarListingsQuerySchema.safeParse({})
		expect(r.success).toBe(true)
		if (r.success) expect(r.data.limit).toBe(12)
	})

	it('rejects limit above max', () => {
		const r = similarListingsQuerySchema.safeParse({ limit: RECOMMENDATIONS_MAX_LIMIT + 1 })
		expect(r.success).toBe(false)
	})
})

describe('trendingQuerySchema', () => {
	it('requires platform', () => {
		const r = trendingQuerySchema.safeParse({ limit: 10 })
		expect(r.success).toBe(false)
	})

	it('accepts mobile', () => {
		const r = trendingQuerySchema.safeParse({ platform: 'mobile', limit: 5 })
		expect(r.success).toBe(true)
	})
})

describe('forMeQuerySchema', () => {
	it('defaults platform to mobile', () => {
		const r = forMeQuerySchema.safeParse({})
		expect(r.success).toBe(true)
		if (r.success) expect(r.data.platform).toBe('mobile')
	})
})
