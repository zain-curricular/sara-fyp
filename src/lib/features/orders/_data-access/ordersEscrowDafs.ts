// ============================================================================
// Orders & escrow — data access (typed admin client)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import type {
	Database,
	EscrowTransactionRow,
	OrderRow,
} from '@/lib/supabase/database.types'

/** Shared SELECT list for `orders` — keep in sync across DAFs that read orders. */
export const ORDER_ROW_SELECT_COLS =
	'id, listing_id, buyer_id, seller_id, assigned_tester_id, amount, status, shipping_tracking_to_center, shipping_tracking_to_buyer, paid_at, shipped_to_center_at, received_at_center_at, testing_completed_at, approved_at, rejected_at, shipped_to_buyer_at, delivered_at, completed_at, cancelled_at, created_at, updated_at' as const

const orderCols = ORDER_ROW_SELECT_COLS

const escrowCols =
	'id, order_id, type, amount, payment_method, external_tx_id, status, metadata, created_at' as const

export async function getOrderById(id: string): Promise<{ data: OrderRow | null; error: unknown }> {
	const { data, error } = await getAdmin().from('orders').select(orderCols).eq('id', id).maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('ordersEscrow:getOrderById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function listOrdersForUser(
	userId: string,
): Promise<{ data: OrderRow[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('orders')
		.select(orderCols)
		.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
		.order('created_at', { ascending: false })

	if (error) {
		logDatabaseError('ordersEscrow:listOrdersForUser', { userId }, error)
	}
	return { data, error }
}

export async function getEscrowTransactionById(
	id: string,
): Promise<{ data: EscrowTransactionRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('escrow_transactions')
		.select(escrowCols)
		.eq('id', id)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('ordersEscrow:getEscrowTransactionById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function listEscrowTransactionsForOrder(
	orderId: string,
): Promise<{ data: EscrowTransactionRow[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('escrow_transactions')
		.select(escrowCols)
		.eq('order_id', orderId)
		.order('created_at', { ascending: false })

	if (error) {
		logDatabaseError('ordersEscrow:listEscrowTransactionsForOrder', { orderId }, error)
	}
	return { data, error }
}

export async function insertOrderEscrowTransaction(
	row: Database['public']['Tables']['escrow_transactions']['Insert'] & { order_id: string },
): Promise<{ data: EscrowTransactionRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('escrow_transactions')
		.insert(row)
		.select(escrowCols)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('ordersEscrow:insertOrderEscrowTransaction', { order_id: row.order_id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function updateEscrowTransactionById(
	id: string,
	patch: {
		status?: EscrowTransactionRow['status']
		external_tx_id?: string | null
		metadata?: Record<string, unknown>
	},
): Promise<{ data: EscrowTransactionRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('escrow_transactions')
		.update(patch as Partial<EscrowTransactionRow>)
		.eq('id', id)
		.select(escrowCols)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('ordersEscrow:updateEscrowTransactionById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export type { OrderRow }
