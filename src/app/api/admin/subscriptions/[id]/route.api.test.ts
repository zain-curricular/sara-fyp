// ============================================================================
// API integration tests — GET/PATCH /api/admin/subscriptions/[id]
// ============================================================================

import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({
	authenticateFromRequest: vi.fn(),
}))

import { GET, PATCH } from './route'
import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../../__tests__/integration'
import { buildJsonRequest, buildRequest } from '../../../../../../__tests__/api'
import { mockAuthenticatedUser, mockUnauthenticated } from '../../../../../../__tests__/api/mockAuth'
import { getAdmin } from '@/lib/supabase/clients/adminClient'

describe.skipIf(!canRunSupabaseIntegrationTests)('GET/PATCH /api/admin/subscriptions/[id]', () => {
	let fx: CatalogApiFixture
	let subscriptionId: string

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
		const admin = getAdmin()
		const { data: sub, error } = await admin
			.from('subscriptions')
			.insert({
				user_id: fx.regularUserId,
				tier: 'premium',
				starts_at: new Date().toISOString(),
				expires_at: new Date(Date.now() + 86400_000).toISOString(),
				max_active_listings: 20,
				max_featured_listings: 2,
				is_active: true,
			})
			.select('id')
			.single()
		if (error || !sub) {
			throw new Error(`seed subscription: ${JSON.stringify(error)}`)
		}
		subscriptionId = sub.id as string
	})

	afterAll(async () => {
		const admin = getAdmin()
		if (subscriptionId) {
			await admin.from('subscriptions').delete().eq('id', subscriptionId)
		}
		await cleanupCatalogApiFixture(fx)
	})

	it('returns 401 when unauthenticated', async () => {
		mockUnauthenticated()
		const res = await GET(
			buildRequest(`/api/admin/subscriptions/${subscriptionId}`),
			{ params: Promise.resolve({ id: subscriptionId }) },
		)
		expect(res.status).toBe(401)
	})

	it('returns 404 when id is not a UUID', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const res = await GET(buildRequest('/api/admin/subscriptions/not-a-uuid'), {
			params: Promise.resolve({ id: 'not-a-uuid' }),
		})
		expect(res.status).toBe(404)
	})

	it('returns 200 for GET by id', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const res = await GET(buildRequest(`/api/admin/subscriptions/${subscriptionId}`), {
			params: Promise.resolve({ id: subscriptionId }),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(body.data.id).toBe(subscriptionId)
	})

	it('returns 200 for PATCH', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const res = await PATCH(
			buildJsonRequest(`/api/admin/subscriptions/${subscriptionId}`, { is_active: false }),
			{ params: Promise.resolve({ id: subscriptionId }) },
		)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(body.data.is_active).toBe(false)
	})
})
