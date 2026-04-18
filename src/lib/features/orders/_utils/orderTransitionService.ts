// ============================================================================
// Orders — participant / admin gating + transition_order delegation
// ============================================================================

import * as Sentry from '@sentry/nextjs'

import { getProfileById } from '@/lib/features/profiles/services'
import type { OrderStatus } from '@/lib/supabase/database.types'
import { serializeError } from '@/lib/utils/serializeError'

import { getOrderById } from '../_data-access/ordersEscrowDafs'
import { transitionOrderWithUserJwt } from './transitionOrderRpc'

export type TransitionOrderForParticipantError =
	| { kind: 'not_found' }
	| { kind: 'forbidden' }
	| { kind: 'rpc_transport'; cause: unknown }
	| { kind: 'empty_response' }
	| {
			kind: 'invalid_transition'
			from?: OrderStatus
			to?: OrderStatus
			rpcMessage: string
	  }

export type TransitionOrderForParticipantResult =
	| { ok: true; data: { new_status: OrderStatus } }
	| { ok: false; error: TransitionOrderForParticipantError }

export async function transitionOrderForParticipant(
	accessToken: string,
	userId: string,
	orderId: string,
	newStatus: OrderStatus,
	metadata: Record<string, unknown>,
): Promise<TransitionOrderForParticipantResult> {
	const { data: order, error: oErr } = await getOrderById(orderId)
	if (oErr) {
		return { ok: false, error: { kind: 'rpc_transport', cause: oErr } }
	}
	if (!order) {
		return { ok: false, error: { kind: 'not_found' } }
	}

	const isParticipant = order.buyer_id === userId || order.seller_id === userId
	if (!isParticipant) {
		// Admins may transition any order id (same as read APIs); non-admins must be buyer or seller.
		const { data: profile } = await getProfileById(userId)
		if (!profile || profile.role !== 'admin') {
			return { ok: false, error: { kind: 'forbidden' } }
		}
	}

	const { data: parsed, error: rpcErr } = await transitionOrderWithUserJwt(
		accessToken,
		orderId,
		newStatus,
		metadata,
	)

	if (rpcErr) {
		console.error('transition_order RPC transport failed', {
			orderId,
			error: serializeError(rpcErr),
		})
		Sentry.captureException(rpcErr instanceof Error ? rpcErr : new Error('transition_order RPC failed'), {
			extra: { orderId, error: serializeError(rpcErr), operation: 'transition_order' },
		})
		return { ok: false, error: { kind: 'rpc_transport', cause: rpcErr } }
	}
	if (!parsed) {
		return { ok: false, error: { kind: 'empty_response' } }
	}
	if (!parsed.ok) {
		console.warn('transition_order invalid transition', {
			orderId,
			from: parsed.from,
			to: parsed.to,
			message: parsed.error,
		})
		Sentry.captureMessage('transition_order invalid transition', {
			level: 'warning',
			extra: {
				orderId,
				from: parsed.from,
				to: parsed.to,
				message: parsed.error,
				operation: 'transition_order',
			},
		})
		return {
			ok: false,
			error: {
				kind: 'invalid_transition',
				from: parsed.from,
				to: parsed.to,
				rpcMessage: parsed.error,
			},
		}
	}

	return { ok: true, data: { new_status: parsed.new_status } }
}
