// ============================================================================
// DAL integration tests — favoritesDafs
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { getAdmin } from '@/lib/supabase/clients/adminClient'

import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../__tests__/integration'
import { deleteFavorite, getFavoriteExists, insertFavorite } from './favoritesDafs'

describe.skipIf(!canRunSupabaseIntegrationTests)('favoritesDafs', () => {
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
				title: `Fav test ${fx.suffix}`,
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
		await admin.from('favorites').delete().eq('listing_id', listingId)
		if (listingId) {
			await admin.from('listings').delete().eq('id', listingId)
		}
		await cleanupCatalogApiFixture(fx)
	})

	it('insertFavorite and getFavoriteExists round-trip', async () => {
		const { error: insErr } = await insertFavorite(fx.regularUserId, listingId)
		expect(insErr).toBeNull()

		const { data: exists, error: exErr } = await getFavoriteExists(fx.regularUserId, listingId)
		expect(exErr).toBeNull()
		expect(exists).toBe(true)

		const { error: delErr } = await deleteFavorite(fx.regularUserId, listingId)
		expect(delErr).toBeNull()
	})
})
