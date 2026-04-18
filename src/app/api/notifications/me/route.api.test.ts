// ============================================================================
// API integration tests — GET /api/notifications/me
// ============================================================================

import { describe, it, expect } from 'vitest'

import { GET } from './route'
import { buildRequest } from '../../../../../__tests__/api'

describe('GET /api/notifications/me', () => {
	it('returns 401 without Authorization', async () => {
		const res = await GET(buildRequest('/api/notifications/me'))
		expect(res.status).toBe(401)
	})
})
