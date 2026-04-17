// ============================================================================
// Favorites & viewed history — public shapes
// ============================================================================

import type { ListingRow } from '@/lib/supabase/database.types'

/** One saved listing in the wishlist (listing row + when it was favorited). */
export type FavoriteListingItem = {
	listing: ListingRow
	favorited_at: string
}

/** Listing row plus last viewed time (recently viewed widget). */
export type ViewedListingItem = {
	listing: ListingRow
	viewed_at: string
}
