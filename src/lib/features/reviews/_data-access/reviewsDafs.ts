// ============================================================================
// Reviews — data access (typed admin client)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import type { Database, ReviewRow } from '@/lib/supabase/database.types'

type ReviewInsert = Database['public']['Tables']['reviews']['Insert']

/**
 * Inserts a review row (service-role; orchestrator validates order + participant).
 */
export async function insertReview(
	row: ReviewInsert,
): Promise<{ data: ReviewRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('reviews')
		.insert(row)
		.select('*')
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('reviews:insertReview', { order_id: row.order_id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

/**
 * Public listing: reviews received by a user, newest first.
 */
export async function listReviewsForReviewedUser(
	reviewedUserId: string,
	opts: { limit: number; offset: number },
): Promise<{ data: ReviewRow[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('reviews')
		.select('*')
		.eq('reviewed_user_id', reviewedUserId)
		.order('created_at', { ascending: false })
		.range(opts.offset, opts.offset + opts.limit - 1)

	if (error) {
		logDatabaseError('reviews:listReviewsForReviewedUser', { reviewedUserId }, error)
	}
	return { data, error }
}

/**
 * Reviews authored by the given user (newest first).
 */
export async function listReviewsByReviewer(
	reviewerId: string,
	opts: { limit: number; offset: number },
): Promise<{ data: ReviewRow[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('reviews')
		.select('*')
		.eq('reviewer_id', reviewerId)
		.order('created_at', { ascending: false })
		.range(opts.offset, opts.offset + opts.limit - 1)

	if (error) {
		logDatabaseError('reviews:listReviewsByReviewer', { reviewerId }, error)
	}
	return { data, error }
}
