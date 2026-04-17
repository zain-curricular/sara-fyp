// ============================================================================
// API integration tests — POST /api/listings/[id]/view
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
} from '../../../../../../__tests__/integration'
import { buildRequest } from '../../../../../../__tests__/api'
import { mockAuthenticatedUser } from '../../../../../../__tests__/api/mockAuth'
import { getAdmin } from '@/lib/supabase/clients/adminClient'

describe.skipIf(!canRunSupabaseIntegrationTests)('POST /api/listings/[id]/view', () => {
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
				title: `View ${fx.suffix}`,
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
		await admin.from('viewed_listings').delete().eq('listing_id', listingId)
		if (listingId) {
			await admin.from('listings').delete().eq('id', listingId)
		}
		await cleanupCatalogApiFixture(fx)
	})

	it('returns 200 and records a view', async () => {
		mockAuthenticatedUser(fx.regularUserId)
		const res = await POST(buildRequest(`/api/listings/${listingId}/view`, { method: 'POST' }), {
			params: Promise.resolve({ id: listingId }),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
	})
})
