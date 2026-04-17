// ============================================================================
// API tests — GET /api/profiles/[id]/reviews
// ============================================================================

import { describe, it, expect } from 'vitest'

import { GET } from './route'

describe('GET /api/profiles/[id]/reviews', () => {
	it('returns 404 when id is not a valid UUID', async () => {
		const res = await GET(new Request('http://localhost/api/profiles/bad-id/reviews'), {
			params: Promise.resolve({ id: 'bad-id' }),
		})
		expect(res.status).toBe(404)
	})
})
