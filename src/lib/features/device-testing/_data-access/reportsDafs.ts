// ============================================================================
// Device testing — test_reports (admin client)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import type { Database, TestReportRow } from '@/lib/supabase/database.types'

const reportCols =
	'id, order_id, tester_id, inspection_results, overall_score, overall_notes, passed, created_at, updated_at' as const

export async function getTestReportById(
	id: string,
): Promise<{ data: TestReportRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('test_reports')
		.select(reportCols)
		.eq('id', id)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('deviceTesting:getTestReportById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function getTestReportByOrderId(
	orderId: string,
): Promise<{ data: TestReportRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('test_reports')
		.select(reportCols)
		.eq('order_id', orderId)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('deviceTesting:getTestReportByOrderId', { orderId }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function insertTestReport(
	row: Database['public']['Tables']['test_reports']['Insert'] & { order_id: string; tester_id: string },
): Promise<{ data: TestReportRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('test_reports')
		.insert(row)
		.select(reportCols)
		.maybeSingle()

	if (error) {
		logDatabaseError('deviceTesting:insertTestReport', { order_id: row.order_id }, error)
	}
	return { data, error }
}

export async function updateTestReportById(
	id: string,
	patch: Database['public']['Tables']['test_reports']['Update'],
): Promise<{ data: TestReportRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('test_reports')
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq('id', id)
		.select(reportCols)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('deviceTesting:updateTestReportById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}
