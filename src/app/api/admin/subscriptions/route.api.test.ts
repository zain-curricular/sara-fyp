// ============================================================================
// API integration tests — POST /api/admin/subscriptions
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

describe.skipIf(!canRunSupabaseIntegrationTests)('POST /api/admin/subscriptions', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		const admin = getAdmin()
		await admin.from('subscriptions').delete().eq('user_id', fx.regularUserId)
		await cleanupCatalogApiFixture(fx)
	})

	it('returns 401 when unauthenticated', async () => {
		mockUnauthenticated()
		const res = await POST(
			buildJsonRequest('/api/admin/subscriptions', {
				user_id: fx.regularUserId,
				tier: 'premium',
			}),
		)
		expect(res.status).toBe(401)
	})

	it('returns 403 when caller is not admin', async () => {
		mockAuthenticatedUser(fx.regularUserId)
		const res = await POST(
			buildJsonRequest('/api/admin/subscriptions', {
				user_id: fx.regularUserId,
				tier: 'premium',
			}),
		)
		expect(res.status).toBe(403)
	})

	it('returns 201 and creates an active subscription', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const res = await POST(
			buildJsonRequest('/api/admin/subscriptions', {
				user_id: fx.regularUserId,
				tier: 'premium',
			}),
		)
		expect(res.status).toBe(201)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(body.data.user_id).toBe(fx.regularUserId)
		expect(body.data.tier).toBe('premium')
		expect(body.data.is_active).toBe(true)
	})
})
