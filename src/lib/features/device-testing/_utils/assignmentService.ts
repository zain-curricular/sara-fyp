// ============================================================================
// Device testing — admin assigns tester to order
// ============================================================================

import { getProfileById } from '@/lib/features/profiles/services'
import { getOrderById } from '@/lib/features/orders/services'
import type { OrderStatus } from '@/lib/supabase/database.types'

import { updateOrderAssignedTester } from '../_data-access/assignmentDafs'

/** Admin may assign a tester only while the order is in the pre-approval testing window. */
const ASSIGNABLE_ORDER_STATUSES: readonly OrderStatus[] = [
	'payment_received',
	'shipped_to_center',
	'under_testing',
]

export async function assignOrderToTester(input: {
	orderId: string
	testerId: string
}): Promise<{ data: { order_id: string; assigned_tester_id: string } | null; error: unknown }> {
	const { data: order, error: oErr } = await getOrderById(input.orderId)
	if (oErr) {
		return { data: null, error: oErr }
	}
	if (!order) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	if (!ASSIGNABLE_ORDER_STATUSES.includes(order.status)) {
		return { data: null, error: new Error('INVALID_ORDER_STATE') }
	}

	const { data: testerProfile } = await getProfileById(input.testerId)
	if (!testerProfile || testerProfile.role !== 'tester') {
		return { data: null, error: new Error('INVALID_TESTER') }
	}

	const { data: updated, error: uErr } = await updateOrderAssignedTester(input.orderId, input.testerId)
	if (uErr) {
		return { data: null, error: uErr }
	}
	if (!updated) {
		return { data: null, error: new Error('NOT_FOUND') }
	}

	return {
		data: { order_id: updated.id, assigned_tester_id: input.testerId },
		error: null,
	}
}
