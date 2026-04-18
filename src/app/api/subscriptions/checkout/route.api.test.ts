// ============================================================================
// API integration tests — POST /api/subscriptions/checkout
// ============================================================================

import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({
	authenticateFromRequest: vi.fn(),
}))

import { POST } from './route'
import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../__tests__/integration'
import { buildJsonRequest } from '../../../../../__tests__/api'
import { mockAuthenticatedUser, mockUnauthenticated } from '../../../../../__tests__/api/mockAuth'
import { getAdmin } from '@/lib/supabase/clients/adminClient'

describe.skipIf(!canRunSupabaseIntegrationTests)('POST /api/subscriptions/checkout', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('returns 401 when unauthenticated', async () => {
		mockUnauthenticated()
		const res = await POST(
			buildJsonRequest('/api/subscriptions/checkout', { target_tier: 'premium' }),
		)
		expect(res.status).toBe(401)
	})

	it('returns 400 when body is invalid', async () => {
		mockAuthenticatedUser(fx.regularUserId)
		const res = await POST(buildJsonRequest('/api/subscriptions/checkout', {}))
		expect(res.status).toBe(400)
	})

	it('returns 200 and creates a pending escrow hold', async () => {
		mockAuthenticatedUser(fx.regularUserId)
		const res = await POST(
			buildJsonRequest('/api/subscriptions/checkout', { target_tier: 'premium' }),
		)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(body.data.escrow_transaction_id).toBeTruthy()

		const admin = getAdmin()
		await admin.from('escrow_transactions').delete().eq('id', body.data.escrow_transaction_id)
	})
})
