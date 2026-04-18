// ============================================================================
// API integration tests — GET /api/listings/[id]/bids
// ============================================================================

import { describe, it, expect } from 'vitest'

import { GET } from './route'
import { buildRequest } from '../../../../../../__tests__/api'

describe('GET /api/listings/[id]/bids', () => {
	it('returns 404 when id is not a UUID', async () => {
		const res = await GET(buildRequest('/api/listings/not-uuid/bids'), {
			params: Promise.resolve({ id: 'not-uuid' }),
		})
		expect(res.status).toBe(404)
	})
})
