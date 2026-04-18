// ============================================================================
// Unit tests — order API HTTP mappers
// ============================================================================

import { describe, it, expect } from 'vitest'

import {
	orderPaymentWebhookErrorToHttp,
	transitionOrderErrorToHttpPayload,
	transitionOrderOutcomeToHttpPayload,
} from '@/lib/features/orders/_utils/orderApiHttp'
import type { TransitionOrderForParticipantResult } from '@/lib/features/orders/_utils/orderTransitionService'

describe('transitionOrderOutcomeToHttpPayload', () => {
	it('maps success', () => {
		const r: TransitionOrderForParticipantResult = {
			ok: true,
			data: { new_status: 'payment_received' },
		}
		const { status, body } = transitionOrderOutcomeToHttpPayload(r)
		expect(status).toBe(200)
		expect(body).toEqual({ ok: true, data: { new_status: 'payment_received' } })
	})

	it('maps invalid_transition with from/to for client', () => {
		const { status, body } = transitionOrderErrorToHttpPayload({
			kind: 'invalid_transition',
			from: 'awaiting_payment',
			to: 'completed',
			rpcMessage: 'Invalid transition',
		})
		expect(status).toBe(409)
		expect(body).toEqual({
			ok: false,
			error: 'Invalid transition',
			data: { from: 'awaiting_payment', to: 'completed' },
		})
	})
})

describe('orderPaymentWebhookErrorToHttp', () => {
	it('maps known Error messages', () => {
		expect(orderPaymentWebhookErrorToHttp(new Error('NOT_FOUND')).status).toBe(404)
		expect(orderPaymentWebhookErrorToHttp(new Error('ORDER_NOT_FOUND')).status).toBe(404)
		expect(orderPaymentWebhookErrorToHttp(new Error('NOT_ORDER_HOLD')).status).toBe(400)
		expect(orderPaymentWebhookErrorToHttp(new Error('INVALID_ORDER_STATE')).status).toBe(409)
		expect(orderPaymentWebhookErrorToHttp(new Error('TRANSITION_FAILED')).status).toBe(500)
		expect(orderPaymentWebhookErrorToHttp(new Error('ESCROW_UPDATE_AFTER_TRANSITION')).status).toBe(500)
	})

	it('maps unknown errors to 500', () => {
		expect(orderPaymentWebhookErrorToHttp(new Error('random')).status).toBe(500)
		expect(orderPaymentWebhookErrorToHttp('not an error').status).toBe(500)
	})
})
