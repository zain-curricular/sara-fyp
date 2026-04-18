// ============================================================================
// Auctions — place bid API orchestration (RPC + HTTP mapping)
// ============================================================================

import * as Sentry from '@sentry/nextjs'

import { serializeError } from '@/lib/utils/serializeError'

import { placeBidWithUserJwt, type PlaceBidResult } from './placeBid'

export type PlaceBidHttpOutcome =
	| { kind: 'success'; data: Extract<PlaceBidResult, { ok: true }> }
	| { kind: 'rpc_transport_error' }
	| { kind: 'no_payload' }
	| { kind: 'domain'; result: Extract<PlaceBidResult, { ok: false }> }

/**
 * Calls `place_bid` with the caller JWT. Logs + Sentry only on Supabase transport failure.
 */
export async function placeBidThroughApi(
	accessToken: string,
	listingId: string,
	amount: number,
): Promise<PlaceBidHttpOutcome> {
	const { data, error } = await placeBidWithUserJwt(accessToken, listingId, amount)

	if (error) {
		console.error('place_bid RPC transport failed', {
			listingId,
			error: serializeError(error),
		})
		Sentry.captureException(error instanceof Error ? error : new Error('place_bid RPC failed'), {
			extra: { listingId, error: serializeError(error), operation: 'place_bid' },
		})
		return { kind: 'rpc_transport_error' }
	}

	if (!data) {
		return { kind: 'no_payload' }
	}

	if (!data.ok) {
		return { kind: 'domain', result: data }
	}

	return { kind: 'success', data }
}

export function placeBidOutcomeToHttpPayload(outcome: PlaceBidHttpOutcome): {
	status: number
	body: { ok: boolean; error?: string; data?: unknown }
} {
	switch (outcome.kind) {
		case 'rpc_transport_error':
			return { status: 500, body: { ok: false, error: 'Failed to place bid' } }
		case 'no_payload':
			return { status: 500, body: { ok: false, error: 'Bid failed' } }
		case 'success':
			return { status: 200, body: { ok: true, data: outcome.data } }
		case 'domain': {
			const d = outcome.result
			if (d.error === 'Bid too low' && d.minimum_bid !== undefined) {
				return {
					status: 400,
					body: { ok: false, error: 'Bid too low', data: { minimum_bid: d.minimum_bid } },
				}
			}
			const clientErr = d.error
			if (clientErr === 'Listing not found' || clientErr === 'Auction config not found') {
				return { status: 404, body: { ok: false, error: 'Not found' } }
			}
			if (clientErr === 'Cannot bid on your own listing') {
				return { status: 403, body: { ok: false, error: 'Cannot bid on your own listing' } }
			}
			if (clientErr === 'Auction has ended' || clientErr === 'Auction has not started') {
				return { status: 409, body: { ok: false, error: clientErr } }
			}
			if (clientErr === 'Listing does not accept bids' || clientErr === 'Listing is not active') {
				return { status: 400, body: { ok: false, error: clientErr } }
			}
			return { status: 400, body: { ok: false, error: clientErr } }
		}
	}
}
