// ============================================================================
// Auctions — auto-bid (proxy) ceilings
// ============================================================================

import { upsertAutoBid } from '@/lib/features/auctions/_data-access/auctionsDafs'
import { getListingById } from '@/lib/features/listings/core/services'
import type { AutoBidRow } from '@/lib/supabase/database.types'

export async function upsertAutoBidForBuyer(
	buyerId: string,
	listingId: string,
	maxAmount: number,
): Promise<{ data: AutoBidRow | null; error: unknown }> {
	const { data: listing, error: lErr } = await getListingById(listingId)
	if (lErr) {
		return { data: null, error: lErr }
	}
	if (!listing) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	if (listing.user_id === buyerId) {
		return { data: null, error: new Error('CANNOT_AUTO_BID_OWN_LISTING') }
	}
	if (listing.sale_type !== 'auction' && listing.sale_type !== 'both') {
		return { data: null, error: new Error('NOT_AUCTION_LISTING') }
	}

	return upsertAutoBid({
		listing_id: listingId,
		user_id: buyerId,
		max_amount: maxAmount,
		is_active: true,
	})
}
