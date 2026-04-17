// ============================================================================
// API integration tests — POST /api/reviews
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
import { GET as getProfile } from '@/app/api/profiles/[id]/route'

describe.skipIf(!canRunSupabaseIntegrationTests)('POST /api/reviews', () => {
	let fx: CatalogApiFixture
	let orderId: string
	let listingId: string
	const buyerId = () => fx.adminUserId
	const sellerId = () => fx.regularUserId

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
		const admin = getAdmin()

		const { data: listing, error: lErr } = await admin
			.from('listings')
			.insert({
				user_id: sellerId(),
				platform: 'mobile',
				category_id: fx.categoryActiveId,
				model_id: fx.modelActiveId,
				title: `Review API ${fx.suffix}`,
				sale_type: 'fixed',
				price: 99,
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
		listingId = listing.id as string

		const { data: order, error: oErr } = await admin
			.from('orders')
			.insert({
				listing_id: listingId,
				buyer_id: buyerId(),
				seller_id: sellerId(),
				amount: 99,
				status: 'completed',
			})
			.select('id')
			.single()
		if (oErr || !order) {
			throw new Error(`seed order: ${JSON.stringify(oErr)}`)
		}
		orderId = order.id as string
	})

	afterAll(async () => {
		const admin = getAdmin()
		await admin.from('reviews').delete().eq('order_id', orderId)
		await admin.from('orders').delete().eq('id', orderId)
		await admin.from('listings').delete().eq('id', listingId)
		await cleanupCatalogApiFixture(fx)
	})

	it('returns 401 when unauthenticated', async () => {
		mockUnauthenticated()
		const res = await POST(
			buildJsonRequest('/api/reviews', { order_id: orderId, rating: 5 }),
		)
		expect(res.status).toBe(401)
	})

	it('returns 201 and updates seller profile aggregates', async () => {
		const admin = getAdmin()
		const { data: beforeProf } = await admin
			.from('profiles')
			.select('total_reviews, avg_rating')
			.eq('id', sellerId())
			.single()
		const beforeCount = beforeProf?.total_reviews ?? 0

		mockAuthenticatedUser(buyerId())
		const res = await POST(
			buildJsonRequest('/api/reviews', {
				order_id: orderId,
				rating: 5,
				comment: 'Excellent seller',
			}),
		)
		expect(res.status).toBe(201)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(body.data.rating).toBe(5)
		expect(body.data.reviewed_user_id).toBe(sellerId())

		const { data: afterProf } = await admin
			.from('profiles')
			.select('total_reviews, avg_rating')
			.eq('id', sellerId())
			.single()
		expect(afterProf?.total_reviews).toBe(beforeCount + 1)

		const profRes = await getProfile(
			new Request(`http://localhost/api/profiles/${sellerId()}`),
			{ params: Promise.resolve({ id: sellerId() }) },
		)
		expect(profRes.status).toBe(200)
		const profBody = await profRes.json()
		expect(profBody.data.total_reviews).toBe(beforeCount + 1)
	})

	it('returns 409 on duplicate review for same order', async () => {
		mockAuthenticatedUser(buyerId())
		const res = await POST(
			buildJsonRequest('/api/reviews', { order_id: orderId, rating: 4 }),
		)
		expect(res.status).toBe(409)
	})
})
