// ============================================================================
// API integration tests — POST /api/warranty-claims
// ============================================================================

import { describe, it, expect } from 'vitest'

import { POST } from './route'
import { buildRequest } from '../../../../__tests__/api'

describe('POST /api/warranty-claims', () => {
	it('returns 401 without Authorization', async () => {
		const res = await POST(
			buildRequest('/api/warranty-claims', {
				method: 'POST',
				body: JSON.stringify({
					warranty_id: '00000000-0000-4000-8000-000000000001',
					issue_description: 'Screen issue',
				}),
			}),
		)
		expect(res.status).toBe(401)
	})
})
