// ============================================================================
// API tests — GET /api/me/reviews-written
// ============================================================================

import { vi, describe, it, expect } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({
	authenticateFromRequest: vi.fn(),
}))

import { GET } from './route'
import { mockUnauthenticated } from '../../../../../__tests__/api/mockAuth'

describe('GET /api/me/reviews-written', () => {
	it('returns 401 when unauthenticated', async () => {
		mockUnauthenticated()
		const res = await GET(new Request('http://localhost/api/me/reviews-written'))
		expect(res.status).toBe(401)
	})
})
