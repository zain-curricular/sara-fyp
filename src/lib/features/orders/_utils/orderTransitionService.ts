// ============================================================================
// Orders — participant / admin gating + transition_order delegation
// ============================================================================

import * as Sentry from '@sentry/nextjs'

import { getProfileById } from '@/lib/features/profiles/services'
import type { OrderStatus } from '@/lib/supabase/database.types'
import { serializeError } from '@/lib/utils/serializeError'

import { getOrderById } from '../_data-access/ordersEscrowDafs'
import { transitionOrderWithUserJwt } from './transitionOrderRpc'

export async function transitionOrderForParticipant(
	accessToken: string,
	userId: string,
	orderId: string,
	newStatus: OrderStatus,
	metadata: Record<string, unknown>,
): Promise<{
	data: { new_status: OrderStatus } | null
	error: unknown
}> {
	const { data: order, error: oErr } = await getOrderById(orderId)
	if (oErr) {
		return { data: null, error: oErr }
	}
	if (!order) {
		return { data: null, error: new Error('NOT_FOUND') }
	}

	const isParticipant = order.buyer_id === userId || order.seller_id === userId
	if (!isParticipant) {
		const { data: profile } = await getProfileById(userId)
		if (!profile || profile.role !== 'admin') {
			return { data: null, error: new Error('FORBIDDEN') }
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
		return { data: null, error: rpcErr }
	}
	if (!parsed) {
		return { data: null, error: new Error('EMPTY_RESPONSE') }
	}
	if (!parsed.ok) {
		return { data: null, error: new Error('INVALID_TRANSITION') }
	}

	return { data: { new_status: parsed.new_status }, error: null }
}
