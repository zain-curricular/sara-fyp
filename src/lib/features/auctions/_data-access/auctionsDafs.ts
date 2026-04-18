// ============================================================================
// Auctions — data access (typed admin client)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import type {
	AuctionConfigRow,
	AutoBidRow,
	BidRow,
	Database,
} from '@/lib/supabase/database.types'

type AuctionConfigInsert = Database['public']['Tables']['auction_config']['Insert']
type AuctionConfigUpdate = Database['public']['Tables']['auction_config']['Update']
type AutoBidInsert = Database['public']['Tables']['auto_bids']['Insert']

const auctionConfigCols =
	'id, listing_id, starting_price, min_increment, auction_start_at, auction_end_at, anti_snipe_minutes, created_at, updated_at' as const
const bidCols = 'id, listing_id, bidder_id, amount, status, is_auto_bid, created_at' as const
const autoBidCols = 'id, listing_id, user_id, max_amount, is_active, created_at, updated_at' as const

export async function getAuctionConfigByListingId(
	listingId: string,
): Promise<{ data: AuctionConfigRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('auction_config')
		.select(auctionConfigCols)
		.eq('listing_id', listingId)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('auctions:getAuctionConfigByListingId', { listingId }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function insertAuctionConfig(
	row: AuctionConfigInsert,
): Promise<{ data: AuctionConfigRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('auction_config')
		.insert(row)
		.select(auctionConfigCols)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('auctions:insertAuctionConfig', { listing_id: row.listing_id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function updateAuctionConfigByListingId(
	listingId: string,
	patch: AuctionConfigUpdate,
): Promise<{ data: AuctionConfigRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('auction_config')
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq('listing_id', listingId)
		.select(auctionConfigCols)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('auctions:updateAuctionConfigByListingId', { listingId }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function countBidsForListing(
	listingId: string,
): Promise<{ data: number; error: unknown }> {
	const { count, error } = await getAdmin()
		.from('bids')
		.select('id', { count: 'exact', head: true })
		.eq('listing_id', listingId)

	if (error) {
		logDatabaseError('auctions:countBidsForListing', { listingId }, error)
		return { data: 0, error }
	}
	return { data: count ?? 0, error: null }
}

export async function listBidsForListing(
	listingId: string,
	limit: number,
): Promise<{ data: BidRow[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('bids')
		.select(bidCols)
		.eq('listing_id', listingId)
		.order('created_at', { ascending: false })
		.limit(limit)

	if (error) {
		logDatabaseError('auctions:listBidsForListing', { listingId }, error)
	}
	return { data, error }
}

export async function listBidsForBidderOnListing(
	listingId: string,
	bidderId: string,
): Promise<{ data: BidRow[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('bids')
		.select(bidCols)
		.eq('listing_id', listingId)
		.eq('bidder_id', bidderId)
		.order('created_at', { ascending: false })

	if (error) {
		logDatabaseError('auctions:listBidsForBidderOnListing', { listingId, bidderId }, error)
	}
	return { data, error }
}

export async function getAutoBidForUserListing(
	userId: string,
	listingId: string,
): Promise<{ data: AutoBidRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('auto_bids')
		.select(autoBidCols)
		.eq('listing_id', listingId)
		.eq('user_id', userId)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('auctions:getAutoBidForUserListing', { userId, listingId }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function upsertAutoBid(
	row: AutoBidInsert,
): Promise<{ data: AutoBidRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('auto_bids')
		.upsert(
			{ ...row, updated_at: new Date().toISOString(), is_active: true },
			{ onConflict: 'listing_id,user_id' },
		)
		.select(autoBidCols)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('auctions:upsertAutoBid', { listing_id: row.listing_id, user_id: row.user_id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

