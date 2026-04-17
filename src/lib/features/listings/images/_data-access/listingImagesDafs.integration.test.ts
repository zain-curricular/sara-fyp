// ============================================================================
// DAL integration tests — listingImagesDafs
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { getAdmin } from '@/lib/supabase/clients/adminClient'

import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../../__tests__/integration'
import {
	countImagesForListing,
	deleteListingImageById,
	getListingImageById,
	createListingImage,
} from './listingImagesDafs'

describe.skipIf(!canRunSupabaseIntegrationTests)('listingImagesDafs', () => {
	let fx: CatalogApiFixture
	let listingId: string
	let imageId: string

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
		const admin = getAdmin()
		const { data: listing, error: lErr } = await admin
			.from('listings')
			.insert({
				user_id: fx.regularUserId,
				platform: 'mobile',
				category_id: fx.categoryActiveId,
				model_id: fx.modelActiveId,
				title: `DAL images ${fx.suffix}`,
				sale_type: 'fixed',
				price: 99,
				condition: 'good',
				details: { ram_gb: 8 },
				city: 'Lahore',
				status: 'draft',
			})
			.select('id')
			.single()
		if (lErr || !listing) {
			throw new Error(`seed listing: ${JSON.stringify(lErr)}`)
		}
		listingId = listing.id as string

		const { data: img, error: iErr } = await createListingImage({
			listing_id: listingId,
			storage_path: `test/${fx.suffix}/a.jpg`,
			url: `https://example.test/${fx.suffix}/a.jpg`,
			position: 0,
		})
		if (iErr || !img) {
			throw new Error(`insert image: ${JSON.stringify(iErr)}`)
		}
		imageId = img.id
	})

	afterAll(async () => {
		const admin = getAdmin()
		if (listingId) {
			await admin.from('listings').delete().eq('id', listingId)
		}
		await cleanupCatalogApiFixture(fx)
	})

	it('countImagesForListing, getListingImageById, and deleteListingImageById', async () => {
		const { data: count, error: cErr } = await countImagesForListing(listingId)
		expect(cErr).toBeNull()
		expect(count).toBe(1)

		const { data, error: gErr } = await getListingImageById(imageId)
		expect(gErr).toBeNull()
		expect(data?.listing_id).toBe(listingId)

		const { error: dErr } = await deleteListingImageById(imageId)
		expect(dErr).toBeNull()
		const { data: gone } = await getListingImageById(imageId)
		expect(gone).toBeNull()
	})
})
