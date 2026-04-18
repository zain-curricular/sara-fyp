// ============================================================================
// Unit tests — place bid HTTP outcome mapping
// ============================================================================

import { describe, it, expect } from 'vitest'

import {
	placeBidOutcomeToHttpPayload,
	type PlaceBidHttpOutcome,
} from '@/lib/features/auctions/_utils/placeBidService'

describe('placeBidOutcomeToHttpPayload', () => {
	it('maps transport failure to 500', () => {
		const o: PlaceBidHttpOutcome = { kind: 'rpc_transport_error' }
		const r = placeBidOutcomeToHttpPayload(o)
		expect(r.status).toBe(500)
		expect(r.body).toEqual({ ok: false, error: 'Failed to place bid' })
	})

	it('maps domain Bid too low with minimum_bid to 400', () => {
		const o: PlaceBidHttpOutcome = {
			kind: 'domain',
			result: { ok: false, error: 'Bid too low', minimum_bid: 500 },
		}
		const r = placeBidOutcomeToHttpPayload(o)
		expect(r.status).toBe(400)
		expect(r.body).toEqual({
			ok: false,
			error: 'Bid too low',
			data: { minimum_bid: 500 },
		})
	})

	it('maps success to 200', () => {
		const o: PlaceBidHttpOutcome = {
			kind: 'success',
			data: {
				ok: true,
				bid_id: 'b1',
				current_bid: 100,
				current_bidder_id: 'u1',
			},
		}
		const r = placeBidOutcomeToHttpPayload(o)
		expect(r.status).toBe(200)
		expect(r.body).toEqual({
			ok: true,
			data: {
				ok: true,
				bid_id: 'b1',
				current_bid: 100,
				current_bidder_id: 'u1',
			},
		})
	})
})
