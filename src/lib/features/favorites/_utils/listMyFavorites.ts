// ============================================================================
// Favorites — paginated wishlist
// ============================================================================

import { listListingsByIds } from '@/lib/features/listings/core/services'
import { listFavoriteLinksForUser } from '@/lib/features/favorites/dataAccess'
import type { FavoriteListingItem } from '@/lib/features/favorites/types'
import type { ListingRow } from '@/lib/supabase/database.types'

export async function listMyFavorites(
	userId: string,
	page: number,
	limit: number,
): Promise<{
	data: FavoriteListingItem[] | null
	pagination: { total: number; limit: number; offset: number; hasMore: boolean } | null
	error: unknown
}> {
	const { data: links, pagination, error } = await listFavoriteLinksForUser(userId, page, limit)
	if (error) {
		return { data: null, pagination: null, error }
	}
	if (!links || links.length === 0) {
		return { data: [], pagination, error: null }
	}

	const ids = links.map((l) => l.listing_id)
	const { data: listings, error: lErr } = await listListingsByIds(ids)
	if (lErr) {
		return { data: null, pagination: null, error: lErr }
	}

	const byId = new Map((listings ?? []).map((l: ListingRow) => [l.id, l]))
	const data: FavoriteListingItem[] = []
	for (const link of links) {
		const listing = byId.get(link.listing_id)
		if (listing) {
			data.push({ listing, favorited_at: link.created_at })
		}
	}

	return { data, pagination, error: null }
}
