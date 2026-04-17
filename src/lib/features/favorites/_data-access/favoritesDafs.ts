// ============================================================================
// Favorites — data access (`favorites` table only, admin client)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'

export type FavoriteLinkRow = {
	listing_id: string
	created_at: string
}

export type PaginatedFavoriteLinks = {
	data: FavoriteLinkRow[] | null
	pagination: { total: number; limit: number; offset: number; hasMore: boolean }
	error: unknown
}

/**
 * Returns whether a favorite row exists for (user, listing).
 */
export async function getFavoriteExists(
	userId: string,
	listingId: string,
): Promise<{ data: boolean; error: unknown }> {
	const { count, error } = await getAdmin()
		.from('favorites')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', userId)
		.eq('listing_id', listingId)

	if (error) {
		logDatabaseError('favorites:getFavoriteExists', { userId, listingId }, error)
		return { data: false, error }
	}
	return { data: (count ?? 0) > 0, error: null }
}

/**
 * Inserts a favorite row (caller verified listing exists).
 */
export async function insertFavorite(userId: string, listingId: string): Promise<{ error: unknown }> {
	const { error } = await getAdmin().from('favorites').insert({
		user_id: userId,
		listing_id: listingId,
	})
	if (error) {
		logDatabaseError('favorites:insertFavorite', { userId, listingId }, error)
	}
	return { error }
}

/**
 * Deletes a favorite row by composite key.
 */
export async function deleteFavorite(userId: string, listingId: string): Promise<{ error: unknown }> {
	const { error } = await getAdmin()
		.from('favorites')
		.delete()
		.eq('user_id', userId)
		.eq('listing_id', listingId)
	if (error) {
		logDatabaseError('favorites:deleteFavorite', { userId, listingId }, error)
	}
	return { error }
}

/**
 * Paginated favorite rows for a user (favorites table only).
 */
export async function listFavoriteLinksForUser(
	userId: string,
	page: number,
	limit: number,
): Promise<PaginatedFavoriteLinks> {
	const offset = (page - 1) * limit
	const to = offset + limit - 1

	const { data: favs, error: fErr, count } = await getAdmin()
		.from('favorites')
		.select('listing_id, created_at', { count: 'exact' })
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.range(offset, to)

	if (fErr) {
		logDatabaseError('favorites:listFavoriteLinksForUser', { userId, page, limit }, fErr)
		return {
			data: null,
			pagination: { total: 0, limit, offset, hasMore: false },
			error: fErr,
		}
	}

	const total = count ?? 0
	const rows: FavoriteLinkRow[] = (favs ?? []).map((f) => ({
		listing_id: f.listing_id as string,
		created_at: f.created_at as string,
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
