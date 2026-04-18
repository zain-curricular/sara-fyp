// ============================================================================
// Device testing — assignment (admin client)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import type { OrderRow } from '@/lib/supabase/database.types'

import { orderCols } from './orderCols'

/** Orders still in the tester workflow (before final approval/shipping outcomes). */
const testerQueueStatuses = [
	'payment_received',
	'shipped_to_center',
	'under_testing',
	'testing_complete',
] as const

/**
 * Orders assigned to a tester that are still relevant for the testing dashboard.
 */
export async function listOrdersForAssignedTester(
	testerId: string,
): Promise<{ data: OrderRow[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('orders')
		.select(orderCols)
		.eq('assigned_tester_id', testerId)
		.in('status', [...testerQueueStatuses])
		.order('updated_at', { ascending: false })

	if (error) {
		logDatabaseError('deviceTesting:listOrdersForAssignedTester', { testerId }, error)
	}
	return { data, error }
}

export async function updateOrderAssignedTester(
	orderId: string,
	testerId: string | null,
): Promise<{ data: OrderRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('orders')
		.update({ assigned_tester_id: testerId, updated_at: new Date().toISOString() })
		.eq('id', orderId)
		.select(orderCols)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('deviceTesting:updateOrderAssignedTester', { orderId, testerId }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}
