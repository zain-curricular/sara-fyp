// ============================================================================
// API integration tests — GET /api/listings/[id]/is-favorited
// ============================================================================

import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({
	authenticateFromRequest: vi.fn(),
}))

import { GET } from './route'
import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../../__tests__/integration'
import { buildRequest } from '../../../../../../__tests__/api'
import { mockAuthenticatedUser } from '../../../../../../__tests__/api/mockAuth'
import { getAdmin } from '@/lib/supabase/clients/adminClient'

describe.skipIf(!canRunSupabaseIntegrationTests)('GET /api/listings/[id]/is-favorited', () => {
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
				title: `Is fav ${fx.suffix}`,
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
		await admin.from('favorites').insert({
			user_id: fx.regularUserId,
			listing_id: listingId,
		})
	})

	afterAll(async () => {
		const admin = getAdmin()
		await admin.from('favorites').delete().eq('listing_id', listingId)
		if (listingId) {
			await admin.from('listings').delete().eq('id', listingId)
		}
		await cleanupCatalogApiFixture(fx)
	})

	it('returns is_favorited true when saved', async () => {
		mockAuthenticatedUser(fx.regularUserId)
		const res = await GET(buildRequest(`/api/listings/${listingId}/is-favorited`), {
			params: Promise.resolve({ id: listingId }),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(body.data.is_favorited).toBe(true)
	})
})
