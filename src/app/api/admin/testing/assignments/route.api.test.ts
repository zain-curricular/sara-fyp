// ============================================================================
// API integration tests — POST /api/admin/testing/assignments
// ============================================================================

import { describe, it, expect } from 'vitest'

import { POST } from './route'
import { buildRequest } from '../../../../../../__tests__/api'

describe('POST /api/admin/testing/assignments', () => {
	it('returns 401 without Authorization', async () => {
		const res = await POST(
			buildRequest('/api/admin/testing/assignments', {
				method: 'POST',
				body: JSON.stringify({
					order_id: '00000000-0000-4000-8000-000000000001',
					tester_id: '00000000-0000-4000-8000-000000000002',
				}),
			}),
		)
		expect(res.status).toBe(401)
	})
})
