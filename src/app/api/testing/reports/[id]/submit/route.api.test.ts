// ============================================================================
// API integration tests — POST /api/testing/reports/[id]/submit
// ============================================================================

import { describe, it, expect } from 'vitest'

import { POST } from './route'
import { buildRequest } from '../../../../../../../__tests__/api'

describe('POST /api/testing/reports/[id]/submit', () => {
	it('returns 401 without Authorization', async () => {
		const res = await POST(
			buildRequest('/api/testing/reports/00000000-0000-4000-8000-000000000099/submit', {
				method: 'POST',
				body: JSON.stringify({
					overall_score: 8,
					passed: true,
				}),
			}),
			{ params: Promise.resolve({ id: '00000000-0000-4000-8000-000000000099' }) },
		)
		expect(res.status).toBe(401)
	})
})
