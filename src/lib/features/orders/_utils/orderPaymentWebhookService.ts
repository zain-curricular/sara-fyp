// ============================================================================
// Orders — payment gateway webhook → escrow complete + payment_received
// ============================================================================

import { logDatabaseError } from '@/lib/observability/logDatabaseError'

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
		return { data: null, error: rpcErr }
	}
	if (!tr?.ok) {
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
		return { data: null, error: uErr }
	}

	return { data: { processed: true }, error: null }
}
