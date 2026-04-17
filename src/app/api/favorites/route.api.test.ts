// ============================================================================
// API integration tests — POST /api/favorites
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
} from '../../../../__tests__/integration'
import { buildJsonRequest } from '../../../../__tests__/api'
import { mockAuthenticatedUser, mockUnauthenticated } from '../../../../__tests__/api/mockAuth'
import { getAdmin } from '@/lib/supabase/clients/adminClient'

describe.skipIf(!canRunSupabaseIntegrationTests)('POST /api/favorites', () => {
	let fx: CatalogApiFixture
	let listingId: string

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
		const admin = getAdmin()
		const { data: listing, error } = await admin
			.from('listings')
			.insert({
				user_id: fx.regularUserId,
				platform: 'mobile',
				category_id: fx.categoryActiveId,
				model_id: fx.modelActiveId,
				title: `API fav ${fx.suffix}`,
				sale_type: 'fixed',
				price: 40,
				condition: 'good',
				details: {},
				city: 'Lahore',
				status: 'active',
				published_at: new Date().toISOString(),
			})
			.select('id')
			.single()
		if (error || !listing) {
			throw new Error(`seed listing: ${JSON.stringify(error)}`)
		}
		listingId = listing.id as string
	})

	afterAll(async () => {
		const admin = getAdmin()
		await admin.from('favorites').delete().eq('listing_id', listingId)
		if (listingId) {
			await admin.from('listings').delete().eq('id', listingId)
		}
		await cleanupCatalogApiFixture(fx)
	})

	it('returns 401 when unauthenticated', async () => {
		mockUnauthenticated()
		const res = await POST(
			buildJsonRequest('/api/favorites', { listing_id: listingId }),
		)
		expect(res.status).toBe(401)
	})

	it('returns 200 and toggles favorite', async () => {
		mockAuthenticatedUser(fx.regularUserId)

		const res1 = await POST(buildJsonRequest('/api/favorites', { listing_id: listingId }))
		expect(res1.status).toBe(200)
		const body1 = await res1.json()
		expect(body1.ok).toBe(true)
		expect(body1.data.is_favorited).toBe(true)

		const res2 = await POST(buildJsonRequest('/api/favorites', { listing_id: listingId }))
		expect(res2.status).toBe(200)
		const body2 = await res2.json()
		expect(body2.data.is_favorited).toBe(false)
	})
})

