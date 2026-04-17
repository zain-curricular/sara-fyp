// ============================================================================
// API integration tests — GET /api/me/recent-views
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
} from '../../../../../__tests__/integration'
import { buildRequest } from '../../../../../__tests__/api'
import { mockAuthenticatedUser } from '../../../../../__tests__/api/mockAuth'
import { getAdmin } from '@/lib/supabase/clients/adminClient'

describe.skipIf(!canRunSupabaseIntegrationTests)('GET /api/me/recent-views', () => {
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
				title: `Recent ${fx.suffix}`,
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
		await admin.from('viewed_listings').upsert(
			{
				user_id: fx.regularUserId,
				listing_id: listingId,
				viewed_at: new Date().toISOString(),
			},
			{ onConflict: 'user_id,listing_id' },
		)
	})

	afterAll(async () => {
		const admin = getAdmin()
		await admin.from('viewed_listings').delete().eq('listing_id', listingId)
		if (listingId) {
			await admin.from('listings').delete().eq('id', listingId)
		}
		await cleanupCatalogApiFixture(fx)
	})

	it('returns 200 with pagination', async () => {
		mockAuthenticatedUser(fx.regularUserId)
		const res = await GET(buildRequest('/api/me/recent-views?page=1&limit=20'))
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(body.pagination).toBeDefined()
	})
})
