// ============================================================================
// Orders — payment gateway webhook → escrow complete + payment_received
// ============================================================================
//
// Ordering: `transition_order` runs before marking the escrow hold completed.
// If the escrow row update fails after a successful transition, the order may
// be `payment_received` while the hold still shows pending — ops must reconcile
// (escrow id + order id are logged to Sentry).

import * as Sentry from '@sentry/nextjs'

import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { serializeError } from '@/lib/utils/serializeError'

import {
	getEscrowTransactionById,
	getOrderById,
	updateEscrowTransactionById,
} from '../_data-access/ordersEscrowDafs'
import { transitionOrderWithServiceRole } from './transitionOrderRpc'

export async function applyOrderPaymentWebhook(input: {
	escrow_transaction_id: string
	external_tx_id: string | null
	status: 'completed' | 'failed'
}): Promise<{ data: { processed: boolean } | null; error: unknown }> {
	const { data: escrow, error: gErr } = await getEscrowTransactionById(input.escrow_transaction_id)
	if (gErr) {
		return { data: null, error: gErr }
	}
	if (!escrow?.order_id) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	if (escrow.type !== 'hold') {
		return { data: null, error: new Error('NOT_ORDER_HOLD') }
	}

	const orderId = escrow.order_id

	if (input.status === 'failed') {
		const { error: uErr } = await updateEscrowTransactionById(input.escrow_transaction_id, {
			status: 'failed',
			external_tx_id: input.external_tx_id,
		})
		if (uErr) {
			logDatabaseError(
				'orders:webhookFailEscrow',
				{ escrowId: input.escrow_transaction_id },
				uErr,
			)
			return { data: null, error: uErr }
		}
		return { data: { processed: true }, error: null }
	}

	const { data: order } = await getOrderById(orderId)
	if (!order) {
		return { data: null, error: new Error('ORDER_NOT_FOUND') }
	}
	if (order.status !== 'awaiting_payment') {
		return { data: null, error: new Error('INVALID_ORDER_STATE') }
	}

	const { data: tr, error: rpcErr } = await transitionOrderWithServiceRole(orderId, 'payment_received', {
		escrow_transaction_id: input.escrow_transaction_id,
		external_tx_id: input.external_tx_id,
	})

	if (rpcErr) {
		console.error('transition_order RPC transport failed (order payment webhook)', {
			orderId,
			escrowId: input.escrow_transaction_id,
			error: serializeError(rpcErr),
		})
		Sentry.captureException(
			rpcErr instanceof Error ? rpcErr : new Error('transition_order RPC failed (webhook)'),
			{
				extra: {
					orderId,
					escrowId: input.escrow_transaction_id,
					error: serializeError(rpcErr),
					operation: 'transition_order',
					context: 'order_payment_webhook',
				},
			},
		)
		return { data: null, error: rpcErr }
	}
	if (!tr || !tr.ok) {
		const from = !tr || tr.ok ? undefined : tr.from
		const to = !tr || tr.ok ? undefined : tr.to
		const message = !tr || tr.ok ? undefined : tr.error
		console.warn('transition_order invalid transition (order payment webhook)', {
			orderId,
			escrowId: input.escrow_transaction_id,
			from,
			to,
			message,
		})
		Sentry.captureMessage('transition_order invalid transition (order payment webhook)', {
			level: 'warning',
			extra: {
				orderId,
				escrowId: input.escrow_transaction_id,
				from,
				to,
				message,
				operation: 'transition_order',
				context: 'order_payment_webhook',
			},
		})
		return { data: null, error: new Error('TRANSITION_FAILED') }
	}

	const { error: uErr } = await updateEscrowTransactionById(input.escrow_transaction_id, {
		status: 'completed',
		external_tx_id: input.external_tx_id,
	})
	if (uErr) {
		logDatabaseError(
			'orders:webhookEscrowUpdateAfterTransition',
			{ escrowId: input.escrow_transaction_id, orderId },
			uErr,
		)
		Sentry.captureMessage('Order payment webhook: escrow update failed after successful transition', {
			level: 'fatal',
			tags: { reconciliation_required: 'true' },
			extra: {
				orderId,
				escrowId: input.escrow_transaction_id,
				error: serializeError(uErr),
				hint: 'Order may be payment_received while escrow hold row is not completed.',
			},
		})
		return { data: null, error: new Error('ESCROW_UPDATE_AFTER_TRANSITION') }
	}

	return { data: { processed: true }, error: null }
}
