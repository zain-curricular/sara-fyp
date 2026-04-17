// ============================================================================
// Viewed listings — data access (`viewed_listings` table only, admin client)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'

export type ViewedLinkRow = {
	listing_id: string
	viewed_at: string
}

export type PaginatedViewedLinks = {
	data: ViewedLinkRow[] | null
	pagination: { total: number; limit: number; offset: number; hasMore: boolean }
	error: unknown
}

/**
 * Upserts a viewed_listings row (refreshes viewed_at). Requires UNIQUE (user_id, listing_id).
 */
export async function upsertViewedListing(
	userId: string,
	listingId: string,
): Promise<{ error: unknown }> {
	const now = new Date().toISOString()
	const { error } = await getAdmin()
		.from('viewed_listings')
		.upsert(
			{
				user_id: userId,
				listing_id: listingId,
				viewed_at: now,
			},
			{ onConflict: 'user_id,listing_id' },
		)
	if (error) {
		logDatabaseError('viewedListings:upsertViewedListing', { userId, listingId }, error)
	}
	return { error }
}

/**
 * Paginated viewed_listings rows for a user (table only).
 */
export async function listViewedLinksForUser(
	userId: string,
	page: number,
	limit: number,
): Promise<PaginatedViewedLinks> {
	const offset = (page - 1) * limit
	const to = offset + limit - 1

	const { data: views, error: vErr, count } = await getAdmin()
		.from('viewed_listings')
		.select('listing_id, viewed_at', { count: 'exact' })
		.eq('user_id', userId)
		.order('viewed_at', { ascending: false })
		.range(offset, to)

	if (vErr) {
		logDatabaseError('viewedListings:listViewedLinksForUser', { userId, page, limit }, vErr)
		return {
			data: null,
			pagination: { total: 0, limit, offset, hasMore: false },
			error: vErr,
		}
	}

	const total = count ?? 0
	const rows: ViewedLinkRow[] = (views ?? []).map((v) => ({
		listing_id: v.listing_id as string,
		viewed_at: v.viewed_at as string,
	}))

	return {
		data: rows,
		pagination: {
			total,
			limit,
			offset,
			hasMore: total > offset + limit,
		},
		error: null,
	}
}
