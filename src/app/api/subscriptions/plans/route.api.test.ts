// ============================================================================
// API integration tests — GET /api/subscriptions/plans
// ============================================================================

import { describe, it, expect } from 'vitest'

import { GET } from './route'

describe('GET /api/subscriptions/plans', () => {
	it('returns 200 and static tiers', async () => {
		const res = await GET()
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(Array.isArray(body.data)).toBe(true)
		expect(body.data.length).toBeGreaterThanOrEqual(3)
		const tiers = (body.data as { tier: string }[]).map((p) => p.tier)
		expect(tiers).toContain('free')
		expect(tiers).toContain('premium')
		expect(tiers).toContain('wholesale')
	})
})
