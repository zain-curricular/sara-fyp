// ============================================================================
// Reviews — post-transaction review orchestration
// ============================================================================

import type { PostReviewInput } from '@/lib/features/reviews/schemas'
import { getOrderById } from '@/lib/features/orders/services'
import { insertReview } from '@/lib/features/reviews/_data-access/reviewsDafs'
import type { ReviewRow } from '@/lib/supabase/database.types'

/**
 * Creates a review for the counterparty on a completed order.
 * Buyer reviews seller and vice versa; one row per (reviewer, order).
 */
export async function postReview(
	reviewerId: string,
	input: PostReviewInput,
): Promise<{ data: ReviewRow | null; error: unknown }> {
	const { data: order, error: oErr } = await getOrderById(input.order_id)
	if (oErr) {
		return { data: null, error: oErr }
	}
	if (!order) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	if (order.status !== 'completed') {
		return { data: null, error: new Error('ORDER_NOT_COMPLETED') }
	}

	const isBuyer = order.buyer_id === reviewerId
	const isSeller = order.seller_id === reviewerId
	if (!isBuyer && !isSeller) {
		return { data: null, error: new Error('NOT_A_PARTICIPANT') }
	}

	const reviewedUserId = isBuyer ? order.seller_id : order.buyer_id

	return insertReview({
		reviewer_id: reviewerId,
		reviewed_user_id: reviewedUserId,
		order_id: input.order_id,
		listing_id: order.listing_id,
		rating: input.rating,
		comment: input.comment ?? null,
	})
}
