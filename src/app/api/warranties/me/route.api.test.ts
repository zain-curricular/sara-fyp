// ============================================================================
// API integration tests — GET /api/warranties/me
// ============================================================================

import { describe, it, expect } from 'vitest'

import { GET } from './route'
import { buildRequest } from '../../../../../__tests__/api'

describe('GET /api/warranties/me', () => {
	it('returns 401 without Authorization', async () => {
		const res = await GET(buildRequest('/api/warranties/me', { method: 'GET' }))
		expect(res.status).toBe(401)
	})
})
