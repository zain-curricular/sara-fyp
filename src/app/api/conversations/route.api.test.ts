// ============================================================================
// API integration tests — POST /api/conversations
// ============================================================================

import { describe, it, expect } from 'vitest'

import { POST } from './route'
import { buildRequest } from '../../../../__tests__/api'

describe('POST /api/conversations', () => {
	it('returns 401 without Authorization', async () => {
		const res = await POST(
			buildRequest('/api/conversations', {
				method: 'POST',
				body: JSON.stringify({ listing_id: '00000000-0000-4000-8000-000000000001' }),
			}),
		)
		expect(res.status).toBe(401)
	})
})
