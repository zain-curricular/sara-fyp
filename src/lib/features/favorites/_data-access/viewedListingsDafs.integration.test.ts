// ============================================================================
// DAL integration tests — viewedListingsDafs
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { getAdmin } from '@/lib/supabase/clients/adminClient'

import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../__tests__/integration'
import { listViewedLinksForUser, upsertViewedListing } from './viewedListingsDafs'

describe.skipIf(!canRunSupabaseIntegrationTests)('viewedListingsDafs', () => {
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
				title: `View test ${fx.suffix}`,
				sale_type: 'fixed',
				price: 50,
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
		await admin.from('viewed_listings').delete().eq('listing_id', listingId)
		if (listingId) {
			await admin.from('listings').delete().eq('id', listingId)
		}
		await cleanupCatalogApiFixture(fx)
	})

	it('upsertViewedListing and listViewedLinksForUser', async () => {
		const { error: upErr } = await upsertViewedListing(fx.regularUserId, listingId)
		expect(upErr).toBeNull()

		const { data, pagination, error } = await listViewedLinksForUser(fx.regularUserId, 1, 20)
		expect(error).toBeNull()
		expect((data ?? []).some((r) => r.listing_id === listingId)).toBe(true)
		expect(pagination.total).toBeGreaterThanOrEqual(1)
	})
})
