// ============================================================================
// Device testing — admin assigns tester to order
// ============================================================================

import { getProfileById } from '@/lib/features/profiles/services'
import { getOrderById } from '@/lib/features/orders/services'

import { updateOrderAssignedTester } from '../_data-access/assignmentDafs'

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
