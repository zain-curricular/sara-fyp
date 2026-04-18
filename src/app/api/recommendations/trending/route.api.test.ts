// ============================================================================
// API tests — GET /api/recommendations/trending
// ============================================================================

import { describe, it, expect } from 'vitest'

import { GET } from './route'
import { buildRequest } from '../../../../../__tests__/api'

describe('GET /api/recommendations/trending', () => {
	it('returns 400 when platform is missing', async () => {
		const res = await GET(buildRequest('/api/recommendations/trending?limit=10'))
		expect(res.status).toBe(400)
	})
})
