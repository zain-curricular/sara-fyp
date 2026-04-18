// ============================================================================
// Orders — HTTP mapping for API routes (thin handlers, rich service context)
// ============================================================================

import type { OrderStatus } from '@/lib/supabase/database.types'

import type {
	TransitionOrderForParticipantError,
	TransitionOrderForParticipantResult,
} from './orderTransitionService'

export function transitionOrderOutcomeToHttpPayload(
	result: TransitionOrderForParticipantResult,
): {
	status: number
	body: { ok: boolean; error?: string; data?: unknown }
} {
	if (result.ok) {
		return { status: 200, body: { ok: true, data: result.data } }
	}
	return transitionOrderErrorToHttpPayload(result.error)
}

export function transitionOrderErrorToHttpPayload(
	error: TransitionOrderForParticipantError,
): {
	status: number
	body: { ok: boolean; error?: string; data?: unknown }
} {
	switch (error.kind) {
		case 'not_found':
			return { status: 404, body: { ok: false, error: 'Not found' } }
		case 'forbidden':
			return { status: 403, body: { ok: false, error: 'Forbidden' } }
		case 'invalid_transition': {
			const safe: { from?: OrderStatus; to?: OrderStatus } = {}
			if (error.from !== undefined) safe.from = error.from
			if (error.to !== undefined) safe.to = error.to
			const hasDetail = Object.keys(safe).length > 0
			return {
				status: 409,
				body: {
					ok: false,
					error: 'Invalid transition',
					...(hasDetail ? { data: safe } : {}),
				},
			}
		}
		case 'empty_response':
			return { status: 500, body: { ok: false, error: 'Transition failed' } }
		case 'rpc_transport':
			return { status: 500, body: { ok: false, error: 'Failed to transition order' } }
		default: {
			const _exhaustive: never = error
			return _exhaustive
		}
	}
}

/** Maps applyOrderPaymentWebhook / DAF errors to HTTP for the webhook route. */
export function orderPaymentWebhookErrorToHttp(error: unknown): {
	status: number
	body: { ok: false; error: string }
} {
	if (error instanceof Error) {
		const msg = error.message
		if (msg === 'NOT_FOUND' || msg === 'ORDER_NOT_FOUND') {
			return { status: 404, body: { ok: false, error: 'Not found' } }
		}
		if (msg === 'NOT_ORDER_HOLD') {
			return { status: 400, body: { ok: false, error: 'Invalid escrow transaction' } }
		}
		if (msg === 'INVALID_ORDER_STATE') {
			return { status: 409, body: { ok: false, error: 'Invalid order state' } }
		}
		if (msg === 'TRANSITION_FAILED') {
			return { status: 500, body: { ok: false, error: 'Failed to update order' } }
		}
		if (msg === 'ESCROW_UPDATE_AFTER_TRANSITION') {
			return { status: 500, body: { ok: false, error: 'Webhook processing failed' } }
		}
	}
	return { status: 500, body: { ok: false, error: 'Webhook processing failed' } }
}
