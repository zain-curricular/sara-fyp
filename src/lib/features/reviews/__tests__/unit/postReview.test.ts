// ============================================================================
// Unit tests — postReview
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/features/orders/services', () => ({
	getOrderById: vi.fn(),
}))

vi.mock('@/lib/features/reviews/_data-access/reviewsDafs', () => ({
	insertReview: vi.fn(),
}))

import { postReview } from '@/lib/features/reviews/_utils/postReview'
import { getOrderById } from '@/lib/features/orders/services'
import { insertReview } from '@/lib/features/reviews/_data-access/reviewsDafs'
import type { OrderRow } from '@/lib/supabase/database.types'

const completedOrder = (overrides: Partial<OrderRow> = {}): OrderRow => ({
	id: '10000000-0000-4000-8000-000000000001',
	listing_id: '20000000-0000-4000-8000-000000000002',
	buyer_id: 'b0000000-0000-4000-8000-0000000000b1',
	seller_id: 'c0000000-0000-4000-8000-0000000000c1',
	assigned_tester_id: null,
	amount: 10,
	status: 'completed',
	shipping_tracking_to_center: null,
	shipping_tracking_to_buyer: null,
	paid_at: null,
	shipped_to_center_at: null,
	received_at_center_at: null,
	testing_completed_at: null,
	approved_at: null,
	rejected_at: null,
	shipped_to_buyer_at: null,
	delivered_at: null,
	completed_at: new Date().toISOString(),
	cancelled_at: null,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...overrides,
})

describe('postReview', () => {
	beforeEach(() => {
		vi.mocked(getOrderById).mockReset()
		vi.mocked(insertReview).mockReset()
	})

	it('returns NOT_FOUND when order missing', async () => {
		vi.mocked(getOrderById).mockResolvedValue({ data: null, error: null })

		const { error } = await postReview('b0000000-0000-4000-8000-0000000000b1', {
			order_id: completedOrder().id,
			rating: 5,
		})

		expect((error as Error).message).toBe('NOT_FOUND')
		expect(insertReview).not.toHaveBeenCalled()
	})

	it('returns ORDER_NOT_COMPLETED when order not completed', async () => {
		vi.mocked(getOrderById).mockResolvedValue({
			data: completedOrder({ status: 'delivered' }),
			error: null,
		})

		const { error } = await postReview('b0000000-0000-4000-8000-0000000000b1', {
			order_id: completedOrder().id,
			rating: 4,
		})

		expect((error as Error).message).toBe('ORDER_NOT_COMPLETED')
	})

	it('returns NOT_A_PARTICIPANT when reviewer is neither buyer nor seller', async () => {
		vi.mocked(getOrderById).mockResolvedValue({ data: completedOrder(), error: null })

		const { error } = await postReview('f0000000-0000-4000-8000-0000000000f1', {
			order_id: completedOrder().id,
			rating: 5,
		})

		expect((error as Error).message).toBe('NOT_A_PARTICIPANT')
	})

	it('inserts buyer reviewing seller', async () => {
		const o = completedOrder()
		vi.mocked(getOrderById).mockResolvedValue({ data: o, error: null })
		vi.mocked(insertReview).mockResolvedValue({
			data: {
				id: 'r1',
				reviewer_id: o.buyer_id,
				reviewed_user_id: o.seller_id,
				order_id: o.id,
				listing_id: o.listing_id,
				rating: 5,
				comment: 'Great',
				created_at: new Date().toISOString(),
			},
			error: null,
		})

		await postReview(o.buyer_id, { order_id: o.id, rating: 5, comment: 'Great' })

		expect(insertReview).toHaveBeenCalledWith({
			reviewer_id: o.buyer_id,
			reviewed_user_id: o.seller_id,
			order_id: o.id,
			listing_id: o.listing_id,
			rating: 5,
			comment: 'Great',
		})
	})

	it('inserts seller reviewing buyer', async () => {
		const o = completedOrder()
		vi.mocked(getOrderById).mockResolvedValue({ data: o, error: null })
		vi.mocked(insertReview).mockResolvedValue({ data: null, error: null })

		await postReview(o.seller_id, { order_id: o.id, rating: 4 })

		expect(insertReview).toHaveBeenCalledWith(
			expect.objectContaining({
				reviewer_id: o.seller_id,
				reviewed_user_id: o.buyer_id,
			}),
		)
	})
})
