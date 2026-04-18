// ============================================================================
// API tests — PATCH /api/admin/moderation/reports/[id]
// ============================================================================

import { describe, it, expect } from 'vitest'

import { PATCH } from './route'
import { buildJsonRequest } from '../../../../../../../__tests__/api'

describe('PATCH /api/admin/moderation/reports/[id]', () => {
	it('returns 401 without Authorization', async () => {
		const res = await PATCH(
			buildJsonRequest(
				'/api/admin/moderation/reports/00000000-0000-4000-8000-000000000001',
				{ status: 'resolved' },
				'PATCH',
			),
			{ params: Promise.resolve({ id: '00000000-0000-4000-8000-000000000001' }) },
		)
		expect(res.status).toBe(401)
	})
})
