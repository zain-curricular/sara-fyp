// ============================================================================
// Favorites — toggle (add/remove) orchestration
// ============================================================================

import { getListingById } from '@/lib/features/listings/core/services'
import { deleteFavorite, getFavoriteExists, insertFavorite } from '@/lib/features/favorites/dataAccess'

export type ToggleFavoriteResult = {
	is_favorited: boolean
}

/**
 * Idempotent wishlist toggle: removes if present, inserts if absent.
 */
export async function toggleFavorite(
	userId: string,
	listingId: string,
): Promise<{ data: ToggleFavoriteResult | null; error: unknown }> {
	const { data: listing, error: lErr } = await getListingById(listingId)
	if (lErr) {
		return { data: null, error: lErr }
	}
	if (!listing) {
		return { data: null, error: 'Not found' }
	}

	const { data: exists, error: exErr } = await getFavoriteExists(userId, listingId)
	if (exErr) {
		return { data: null, error: exErr }
	}

	if (exists) {
		const { error } = await deleteFavorite(userId, listingId)
		if (error) {
			return { data: null, error }
		}
		return { data: { is_favorited: false }, error: null }
	}

	const { error } = await insertFavorite(userId, listingId)
	if (error) {
		return { data: null, error }
	}
	return { data: { is_favorited: true }, error: null }
}
