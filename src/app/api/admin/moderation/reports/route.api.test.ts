// ============================================================================
// API tests — GET /api/admin/moderation/reports
// ============================================================================

import { describe, it, expect } from 'vitest'

import { GET } from './route'
import { buildRequest } from '../../../../../../__tests__/api'

describe('GET /api/admin/moderation/reports', () => {
	it('returns 401 without Authorization', async () => {
		const res = await GET(buildRequest('/api/admin/moderation/reports'))
		expect(res.status).toBe(401)
	})
})
