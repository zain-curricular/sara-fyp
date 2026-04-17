// ============================================================================
// Reviews — data access (typed admin client)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import type { Database, ReviewRow } from '@/lib/supabase/database.types'

type ReviewInsert = Database['public']['Tables']['reviews']['Insert']

/** List reads return data + pagination envelope (see `_CONVENTIONS/architecture/data-access`). */
export type PaginatedReviews = {
	data: ReviewRow[] | null
	pagination: { total: number; limit: number; offset: number; hasMore: boolean }
	error: unknown
}

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
 * Public listing: reviews received by a user, newest first (paginated).
 */
export async function listReviewsForReviewedUser(
	reviewedUserId: string,
	page: number,
	limit: number,
): Promise<PaginatedReviews> {
	const offset = (page - 1) * limit
	const to = offset + limit - 1

	const { data: rows, error, count } = await getAdmin()
		.from('reviews')
		.select('*', { count: 'exact' })
		.eq('reviewed_user_id', reviewedUserId)
		.order('created_at', { ascending: false })
		.range(offset, to)

	if (error) {
		logDatabaseError('reviews:listReviewsForReviewedUser', { reviewedUserId, page, limit }, error)
		return {
			data: null,
			pagination: { total: 0, limit, offset, hasMore: false },
			error,
		}
	}

	const total = count ?? 0
	return {
		data: rows ?? [],
		pagination: {
			total,
			limit,
			offset,
			hasMore: total > offset + limit,
		},
		error: null,
	}
}

/**
 * Reviews authored by the given user (newest first, paginated).
 */
export async function listReviewsByReviewer(
	reviewerId: string,
	page: number,
	limit: number,
): Promise<PaginatedReviews> {
	const offset = (page - 1) * limit
	const to = offset + limit - 1

	const { data: rows, error, count } = await getAdmin()
		.from('reviews')
		.select('*', { count: 'exact' })
		.eq('reviewer_id', reviewerId)
		.order('created_at', { ascending: false })
		.range(offset, to)

	if (error) {
		logDatabaseError('reviews:listReviewsByReviewer', { reviewerId, page, limit }, error)
		return {
			data: null,
			pagination: { total: 0, limit, offset, hasMore: false },
			error,
		}
	}

	const total = count ?? 0
	return {
		data: rows ?? [],
		pagination: {
			total,
			limit,
			offset,
			hasMore: total > offset + limit,
		},
		error: null,
	}
}
