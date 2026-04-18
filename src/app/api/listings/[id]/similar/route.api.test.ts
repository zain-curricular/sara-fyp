// ============================================================================
// API tests — GET /api/listings/[id]/similar
// ============================================================================

import { describe, it, expect } from 'vitest'

import { GET } from './route'
import { buildRequest } from '../../../../../../__tests__/api'

describe('GET /api/listings/[id]/similar', () => {
	it('returns 404 for non-uuid id', async () => {
		const res = await GET(
			buildRequest('/api/listings/not-a-uuid/similar'),
			{ params: Promise.resolve({ id: 'not-a-uuid' }) },
		)
		expect(res.status).toBe(404)
	})

	it('returns 400 for invalid query', async () => {
		const id = '00000000-0000-4000-8000-000000000001'
		const res = await GET(buildRequest(`/api/listings/${id}/similar?limit=999`), {
			params: Promise.resolve({ id }),
		})
		expect(res.status).toBe(400)
	})
})
