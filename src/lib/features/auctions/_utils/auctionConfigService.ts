// ============================================================================
// Auctions — config CRUD (owner-only; lock after first bid)
// ============================================================================

import {
	countBidsForListing,
	getAuctionConfigByListingId,
	insertAuctionConfig,
	updateAuctionConfigByListingId,
} from '@/lib/features/auctions/_data-access/auctionsDafs'
import { getListingById } from '@/lib/features/listings/core/services'
import type { AuctionConfigRow, Database } from '@/lib/supabase/database.types'
import type { CreateAuctionConfigBody, PatchAuctionConfigBody } from '@/lib/features/auctions/schemas'

type AuctionConfigUpdate = Database['public']['Tables']['auction_config']['Update']

export type AuctionDetailPayload = {
	config: AuctionConfigRow
	bid_count: number
}

export async function getAuctionDetailForListing(
	listingId: string,
): Promise<{ data: AuctionDetailPayload | null; error: unknown }> {
	const [{ data: config, error: cErr }, { data: bidCount, error: nErr }] = await Promise.all([
		getAuctionConfigByListingId(listingId),
		countBidsForListing(listingId),
	])
	if (cErr) {
		return { data: null, error: cErr }
	}
	if (nErr) {
		return { data: null, error: nErr }
	}
	if (!config) {
		return { data: null, error: null }
	}
	return { data: { config, bid_count: bidCount }, error: null }
}

export async function createAuctionConfigForSeller(
	sellerId: string,
	listingId: string,
	body: CreateAuctionConfigBody,
): Promise<{ data: AuctionConfigRow | null; error: unknown }> {
	const { data: listing, error: lErr } = await getListingById(listingId)
	if (lErr) {
		return { data: null, error: lErr }
	}
	if (!listing) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	if (listing.user_id !== sellerId) {
		return { data: null, error: new Error('FORBIDDEN') }
	}
	if (listing.sale_type !== 'auction' && listing.sale_type !== 'both') {
		return { data: null, error: new Error('NOT_AUCTION_LISTING') }
	}

	const { data: existing } = await getAuctionConfigByListingId(listingId)
	if (existing) {
		return { data: null, error: new Error('CONFIG_EXISTS') }
	}

	return insertAuctionConfig({
		listing_id: listingId,
		starting_price: body.starting_price,
		min_increment: body.min_increment,
		auction_start_at: body.auction_start_at,
		auction_end_at: body.auction_end_at,
		anti_snipe_minutes: body.anti_snipe_minutes,
	})
}

export async function patchAuctionConfigForSeller(
	sellerId: string,
	listingId: string,
	body: PatchAuctionConfigBody,
): Promise<{ data: AuctionConfigRow | null; error: unknown }> {
	const { data: listing, error: lErr } = await getListingById(listingId)
	if (lErr) {
		return { data: null, error: lErr }
	}
	if (!listing) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	if (listing.user_id !== sellerId) {
		return { data: null, error: new Error('FORBIDDEN') }
	}

	const { data: bidCount, error: bcErr } = await countBidsForListing(listingId)
	if (bcErr) {
		return { data: null, error: bcErr }
	}
	if (bidCount > 0) {
		return { data: null, error: new Error('CONFIG_LOCKED') }
	}

	const { data: existing, error: gErr } = await getAuctionConfigByListingId(listingId)
	if (gErr) {
		return { data: null, error: gErr }
	}
	if (!existing) {
		return { data: null, error: new Error('NOT_FOUND') }
	}

	const patch: AuctionConfigUpdate = {}
	if (body.starting_price !== undefined) {
		patch.starting_price = body.starting_price
	}
	if (body.min_increment !== undefined) {
		patch.min_increment = body.min_increment
	}
	if (body.auction_start_at !== undefined) {
		patch.auction_start_at = body.auction_start_at
	}
	if (body.auction_end_at !== undefined) {
		patch.auction_end_at = body.auction_end_at
	}
	if (body.anti_snipe_minutes !== undefined) {
		patch.anti_snipe_minutes = body.anti_snipe_minutes
	}
	if (Object.keys(patch).length === 0) {
		return { data: existing, error: null }
	}

	const mergedStart = patch.auction_start_at ?? existing.auction_start_at
	const mergedEnd = patch.auction_end_at ?? existing.auction_end_at
	if (new Date(mergedEnd) <= new Date(mergedStart)) {
		return { data: null, error: new Error('INVALID_AUCTION_WINDOW') }
	}

	return updateAuctionConfigByListingId(listingId, patch)
}
