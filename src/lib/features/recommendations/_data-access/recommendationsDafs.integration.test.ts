// ============================================================================
// Integration tests — recommendations DAFs (Supabase)
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../__tests__/integration'

import { countViewedListingsForUser } from './recommendationsDafs'

describe.skipIf(!canRunSupabaseIntegrationTests)('recommendationsDafs', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('countViewedListingsForUser returns 0 for new user', async () => {
		const { data, error } = await countViewedListingsForUser(fx.regularUserId)
		expect(error).toBeNull()
		expect(data).toBe(0)
	})

	it('countViewedListingsForUser increments after insert', async () => {
		const admin = getAdmin()
		const { data: listing, error: lErr } = await admin
			.from('listings')
			.insert({
				user_id: fx.regularUserId,
				platform: 'mobile',
				category_id: fx.categoryActiveId,
				model_id: fx.modelActiveId,
				title: `View count ${fx.suffix}`,
				sale_type: 'fixed',
				price: 10,
				condition: 'good',
				details: {},
				city: 'Lahore',
				status: 'active',
				published_at: new Date().toISOString(),
			})
			.select('id')
			.single()
		if (lErr || !listing) {
			throw new Error(`seed listing: ${JSON.stringify(lErr)}`)
		}
		const listingId = listing.id as string

		await admin.from('viewed_listings').upsert(
			{
				user_id: fx.regularUserId,
				listing_id: listingId,
				viewed_at: new Date().toISOString(),
			},
			{ onConflict: 'user_id,listing_id' },
		)

		const { data, error } = await countViewedListingsForUser(fx.regularUserId)
		expect(error).toBeNull()
		expect(data).toBeGreaterThanOrEqual(1)

		await admin.from('viewed_listings').delete().eq('listing_id', listingId)
		await admin.from('listings').delete().eq('id', listingId)
	})
})
