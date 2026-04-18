// ============================================================================
// Auctions — public bid feed (pseudonymous) + my bids
// ============================================================================

import { createHash } from 'node:crypto'

import { listBidsForBidderOnListing, listBidsForListing } from '@/lib/features/auctions/_data-access/auctionsDafs'
import type { BidRow } from '@/lib/supabase/database.types'

const FEED_LIMIT = 100

/**
 * Stable opaque label per (listing, bidder) — no PII (see privacy / bid feed spec).
 */
export function bidderRefForPublicFeed(listingId: string, bidderId: string): string {
	return createHash('sha256')
		.update(`${listingId}\0${bidderId}`, 'utf8')
		.digest('hex')
		.slice(0, 16)
}

export type PublicBidFeedItem = {
	amount: number
	created_at: string
	status: BidRow['status']
	is_auto_bid: boolean
	/** Opaque stable id for this bidder on this listing (not personally identifying). */
	bidder_ref: string
}

export async function getPublicBidFeed(
	listingId: string,
): Promise<{ data: PublicBidFeedItem[] | null; error: unknown }> {
	const { data: bids, error: bErr } = await listBidsForListing(listingId, FEED_LIMIT)
	if (bErr) {
		return { data: null, error: bErr }
	}
	if (!bids?.length) {
		return { data: [], error: null }
	}

	const out: PublicBidFeedItem[] = bids.map((b) => ({
		amount: b.amount,
		created_at: b.created_at,
		status: b.status,
		is_auto_bid: b.is_auto_bid,
		bidder_ref: bidderRefForPublicFeed(listingId, b.bidder_id),
	}))
	return { data: out, error: null }
}

export async function getMyBidsOnListing(
	bidderId: string,
	listingId: string,
): Promise<{ data: BidRow[] | null; error: unknown }> {
	return listBidsForBidderOnListing(listingId, bidderId)
}
