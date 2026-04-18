// ============================================================================
// API tests — GET /api/admin/analytics/overview
// ============================================================================

import { describe, it, expect } from 'vitest'

import { GET } from './route'
import { buildRequest } from '../../../../../../__tests__/api'

describe('GET /api/admin/analytics/overview', () => {
	it('returns 401 without Authorization', async () => {
		const res = await GET(buildRequest('/api/admin/analytics/overview?days=7'))
		expect(res.status).toBe(401)
	})
})
