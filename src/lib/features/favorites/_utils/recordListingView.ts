// ============================================================================
// Viewed history — record a listing view (upsert)
// ============================================================================

import { getListingById } from '@/lib/features/listings/core/services'
import { upsertViewedListing } from '@/lib/features/favorites/dataAccess'

/**
 * Records a view for analytics / recommendations. No-op if listing missing.
 */
export async function recordListingView(
	userId: string,
	listingId: string,
): Promise<{ error: unknown }> {
	const { data: listing, error: lErr } = await getListingById(listingId)
	if (lErr) {
		return { error: lErr }
	}
	if (!listing) {
		return { error: 'Not found' }
	}

	return upsertViewedListing(userId, listingId)
}
