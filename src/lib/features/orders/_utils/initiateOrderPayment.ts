// ============================================================================
// Orders — buyer initiates escrow hold + checkout redirect
// ============================================================================

import type { PaymentMethod } from '@/lib/supabase/database.types'

import {
	getOrderById,
	insertOrderEscrowTransaction,
} from '../_data-access/ordersEscrowDafs'
import { buildOrderCheckoutRedirectUrl } from '../_adapters/gatewayStub'

const DEFAULT_FEE_BPS = 250

export async function initiateOrderPaymentForBuyer(
	buyerId: string,
	orderId: string,
	paymentMethod: PaymentMethod,
): Promise<{
	data: { escrow_transaction_id: string; checkout_url: string; amount: number } | null
	error: unknown
}> {
	const { data: order, error: oErr } = await getOrderById(orderId)
	if (oErr) {
		return { data: null, error: oErr }
	}
	if (!order) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	if (order.buyer_id !== buyerId) {
		return { data: null, error: new Error('FORBIDDEN') }
	}
	if (order.status !== 'awaiting_payment') {
		return { data: null, error: new Error('INVALID_STATE') }
	}

	const feeBps = DEFAULT_FEE_BPS
	const feeAmount = Math.round(order.amount * feeBps) / 10_000

	const { data: escrow, error: eErr } = await insertOrderEscrowTransaction({
		order_id: orderId,
		type: 'hold',
		amount: order.amount,
		payment_method: paymentMethod,
		status: 'pending',
		metadata: {
			kind: 'order_hold' as const,
			fee_bps: feeBps,
			fee_amount: feeAmount,
		},
	})

	if (eErr) {
		return { data: null, error: eErr }
	}
	if (!escrow) {
		return { data: null, error: new Error('INSERT_FAILED') }
	}

	const checkout_url = buildOrderCheckoutRedirectUrl(orderId, escrow.id)

	return {
		data: {
			escrow_transaction_id: escrow.id,
			checkout_url,
			amount: order.amount,
		},
		error: null,
	}
}
