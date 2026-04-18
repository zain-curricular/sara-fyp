// ============================================================================
// Auctions — place bid via SECURITY INVOKER RPC (caller JWT → auth.uid())
// ============================================================================

import { createUserSupabaseClient } from '@/lib/supabase/userClient'
import type { Json } from '@/lib/supabase/database.types'

export type PlaceBidResult =
	| { ok: true; bid_id: string | null; current_bid: number; current_bidder_id: string | null }
	| { ok: false; error: string; minimum_bid?: number }

function parseRpcPayload(data: Json | null): PlaceBidResult {
	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return { ok: false, error: 'Invalid response' }
	}
	const o = data as Record<string, Json | undefined>
	if (o.error && typeof o.error === 'string') {
		const min = o.minimum_bid
		return {
			ok: false,
			error: o.error,
			minimum_bid: typeof min === 'number' ? min : typeof min === 'string' ? Number(min) : undefined,
		}
	}
	if (o.success === true) {
		const bidId = o.bid_id
		const cur = o.current_bid
		const bidder = o.current_bidder_id
		return {
			ok: true,
			bid_id: typeof bidId === 'string' ? bidId : null,
			current_bid: typeof cur === 'number' ? cur : Number(cur),
			current_bidder_id: typeof bidder === 'string' ? bidder : null,
		}
	}
	return { ok: false, error: 'Bid failed' }
}

/**
 * Places a bid using the caller's JWT so `place_bid` sees `auth.uid()`.
 */
export async function placeBidWithUserJwt(
	accessToken: string,
	listingId: string,
	amount: number,
): Promise<{ data: PlaceBidResult | null; error: unknown }> {
	const supabase = createUserSupabaseClient(accessToken)
	const { data, error } = await supabase.rpc('place_bid', {
		p_listing_id: listingId,
		p_amount: amount,
	})

	if (error) {
		return { data: null, error }
	}

	return { data: parseRpcPayload(data), error: null }
}
