// ============================================================================
// DAL integration tests — listingsDafs
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
	deleteListing,
	getListingById,
	listListingsByUserId,
	searchListings,
} from './listingsDafs'

describe.skipIf(!canRunSupabaseIntegrationTests)('listingsDafs', () => {
	let fx: CatalogApiFixture
	let listingId: string

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
		const admin = getAdmin()
		const { data, error } = await admin
			.from('listings')
			.insert({
				user_id: fx.regularUserId,
				platform: 'mobile',
				category_id: fx.categoryActiveId,
				model_id: fx.modelActiveId,
				title: `DAL listing ${fx.suffix}`,
				sale_type: 'fixed',
				price: 199.99,
				condition: 'good',
				details: { ram_gb: 8 },
				city: 'Lahore',
				status: 'draft',
			})
			.select('id')
			.single()
		if (error || !data) {
			throw new Error(`seed listing: ${JSON.stringify(error)}`)
		}
		listingId = data.id as string

		const { error: pubErr } = await admin
			.from('listings')
			.update({
				status: 'active',
				published_at: new Date().toISOString(),
			})
			.eq('id', listingId)
		if (pubErr) {
			throw new Error(`publish listing: ${JSON.stringify(pubErr)}`)
		}
	})

	afterAll(async () => {
		const admin = getAdmin()
		if (listingId) {
			await admin.from('listings').delete().eq('id', listingId)
		}
		await cleanupCatalogApiFixture(fx)
	})

	it('getListingById returns the row', async () => {
		const { data, error } = await getListingById(listingId)
		expect(error).toBeNull()
		expect(data?.id).toBe(listingId)
		expect(data?.status).toBe('active')
	})

	it('listListingsByUserId includes the seller listing', async () => {
		const { data, error } = await listListingsByUserId(fx.regularUserId)
		expect(error).toBeNull()
		const ids = (data ?? []).map((r) => r.id)
		expect(ids).toContain(listingId)
	})

	it('searchListings finds active listing by platform', async () => {
		const { data, error, pagination } = await searchListings({
			platform: 'mobile',
			page: 1,
			limit: 50,
		})
		expect(error).toBeNull()
		expect(pagination.total >= 1).toBe(true)
		const ids = (data ?? []).map((r) => r.id)
		expect(ids).toContain(listingId)
	})

	it('deleteListing removes a listing', async () => {
		const admin = getAdmin()
		const { data: row, error: insErr } = await admin
			.from('listings')
			.insert({
				user_id: fx.regularUserId,
				platform: 'mobile',
				category_id: fx.categoryActiveId,
				model_id: fx.modelActiveId,
				title: `To delete ${fx.suffix}`,
				sale_type: 'fixed',
				price: 50,
				condition: 'fair',
				details: {},
				city: 'Karachi',
				status: 'draft',
			})
			.select('id')
			.single()
		expect(insErr).toBeNull()
		const id = row!.id as string

		const { error } = await deleteListing(id)
		expect(error).toBeNull()

		const { data: gone } = await getListingById(id)
		expect(gone).toBeNull()
	})
})
