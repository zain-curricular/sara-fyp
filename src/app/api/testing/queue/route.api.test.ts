// ============================================================================
// API integration tests — GET /api/testing/queue
// ============================================================================

import { describe, it, expect } from 'vitest'

import { GET } from './route'
import { buildRequest } from '../../../../../__tests__/api'

describe('GET /api/testing/queue', () => {
	it('returns 401 without Authorization', async () => {
		const res = await GET(buildRequest('/api/testing/queue', { method: 'GET' }))
		expect(res.status).toBe(401)
	})
})
