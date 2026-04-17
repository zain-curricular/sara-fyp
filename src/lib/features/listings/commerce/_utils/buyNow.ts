// ============================================================================
// Listings — buy-now (RPC `create_buy_now_order`)
// ============================================================================
//
// Must run with the buyer’s JWT so `auth.uid()` inside the SQL function resolves.

import { createUserSupabaseClient } from '@/lib/supabase/userClient'

export type BuyNowResult =
	| { ok: true; orderId: string }
	| { ok: false; error: string }

/**
 * Calls `create_buy_now_order` as the authenticated buyer.
 *
 * @param accessToken - Raw JWT from `Authorization: Bearer`.
 * @param listingId - Target listing id.
 */
export async function buyNowListing(accessToken: string, listingId: string): Promise<BuyNowResult> {
	const client = createUserSupabaseClient(accessToken)
	const { data, error } = await client.rpc('create_buy_now_order', { p_listing_id: listingId })

	if (error) {
		const msg = error.message?.includes('Listing limit') ? 'Could not complete purchase' : error.message
		return { ok: false, error: msg ?? 'Purchase failed' }
	}

	const payload = data as Record<string, unknown> | null
	if (payload?.error) {
		return { ok: false, error: String(payload.error) }
	}
	if (payload?.success === true && payload.order_id) {
		return { ok: true, orderId: String(payload.order_id) }
	}

	return { ok: false, error: 'Purchase failed' }
}
