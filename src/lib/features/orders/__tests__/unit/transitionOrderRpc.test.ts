// ============================================================================
// Unit tests — transition_order RPC payload parsing
// ============================================================================

import { describe, it, expect } from 'vitest'

import { parseTransitionOrderRpcPayload } from '@/lib/features/orders/_utils/transitionOrderRpc'

describe('parseTransitionOrderRpcPayload', () => {
	it('parses success', () => {
		const r = parseTransitionOrderRpcPayload({
			success: true,
			order_id: '00000000-0000-4000-8000-000000000001',
			new_status: 'payment_received',
		})
		expect(r.ok).toBe(true)
		if (r.ok) {
			expect(r.new_status).toBe('payment_received')
		}
	})

	it('parses invalid transition error', () => {
		const r = parseTransitionOrderRpcPayload({
			error: 'Invalid transition',
			from: 'awaiting_payment',
			to: 'completed',
		})
		expect(r.ok).toBe(false)
		if (!r.ok) {
			expect(r.error).toBe('Invalid transition')
			expect(r.from).toBe('awaiting_payment')
			expect(r.to).toBe('completed')
		}
	})
})
