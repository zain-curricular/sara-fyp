// ============================================================================
// Favorites — single listing check
// ============================================================================

import { getFavoriteExists } from '@/lib/features/favorites/dataAccess'

export async function isListingFavorited(
	userId: string,
	listingId: string,
): Promise<{ data: boolean; error: unknown }> {
	return getFavoriteExists(userId, listingId)
}
