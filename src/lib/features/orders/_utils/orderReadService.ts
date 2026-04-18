// ============================================================================
// Orders — participant-scoped reads (buyer, seller, admin)
// ============================================================================

import { getTestReportByOrderId } from '@/lib/features/device-testing/orderReads'
import { getProfileById } from '@/lib/features/profiles/services'
import type { EscrowTransactionRow, OrderRow } from '@/lib/supabase/database.types'

import {
	getOrderById,
	listEscrowTransactionsForOrder,
	listOrdersForUser,
} from '../_data-access/ordersEscrowDafs'

export async function listOrdersForCurrentUser(
	userId: string,
): Promise<{ data: OrderRow[] | null; error: unknown }> {
	return listOrdersForUser(userId)
}

export type OrderDetailPayload = {
	order: OrderRow
	escrow_transactions: EscrowTransactionRow[]
	/** Buyer/seller/admin: verdict summary only (no notes — avoids leaking tester commentary). */
	test_report_public?: {
		passed: boolean
		overall_score: number | null
	}
}

export async function getOrderDetailForParticipant(
	userId: string,
	orderId: string,
): Promise<{ data: OrderDetailPayload | null; error: unknown }> {
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

	const { data: escrows, error: eErr } = await listEscrowTransactionsForOrder(orderId)
	if (eErr) {
		return { data: null, error: eErr }
	}

	const { data: tr } = await getTestReportByOrderId(orderId)
	const test_report_public =
		tr && tr.passed !== null
			? {
					passed: tr.passed,
					overall_score: tr.overall_score,
				}
			: undefined

	return {
		data: {
			order,
			escrow_transactions: escrows ?? [],
			...(test_report_public ? { test_report_public } : {}),
		},
		error: null,
	}
}
