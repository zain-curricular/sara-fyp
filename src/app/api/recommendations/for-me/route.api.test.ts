// ============================================================================
// API tests — GET /api/recommendations/for-me
// ============================================================================

import { describe, it, expect } from 'vitest'

import { GET } from './route'
import { buildRequest } from '../../../../../__tests__/api'

describe('GET /api/recommendations/for-me', () => {
	it('returns 401 without Authorization', async () => {
		const res = await GET(buildRequest('/api/recommendations/for-me'))
		expect(res.status).toBe(401)
	})
})
