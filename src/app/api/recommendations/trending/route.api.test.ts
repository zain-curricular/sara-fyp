// ============================================================================
// API tests — GET /api/recommendations/trending
// ============================================================================

import { describe, it, expect } from 'vitest'

import { GET } from './route'
import { buildRequest } from '../../../../../__tests__/api'
import { canRunSupabaseIntegrationTests } from '../../../../../__tests__/integration'

describe('GET /api/recommendations/trending', () => {
	it('returns 400 when platform is missing', async () => {
		const res = await GET(buildRequest('/api/recommendations/trending?limit=10'))
		expect(res.status).toBe(400)
	})
})

describe.skipIf(!canRunSupabaseIntegrationTests)('GET /api/recommendations/trending (integration)', () => {
	it('returns 200 with data array when platform is valid', async () => {
		const res = await GET(buildRequest('/api/recommendations/trending?platform=mobile&limit=5'))
		expect(res.status).toBe(200)
		const body = (await res.json()) as { ok: boolean; data: unknown[] }
		expect(body.ok).toBe(true)
		expect(Array.isArray(body.data)).toBe(true)
	})
})
