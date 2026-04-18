// ============================================================================
// Admin Panel — moderation reports DAFs
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import type { ReportRow, ReportStatus } from '@/lib/supabase/database.types'

export type PaginatedReports = {
	data: ReportRow[] | null
	pagination: { total: number; limit: number; offset: number; hasMore: boolean }
	error: unknown
}

export async function listReportsForAdmin(input: {
	status?: ReportStatus
	limit: number
	offset: number
}): Promise<PaginatedReports> {
	const to = input.offset + input.limit - 1
	let q = getAdmin().from('reports').select('*', { count: 'exact' })
	if (input.status) {
		q = q.eq('status', input.status)
	}
	const { data: rows, error, count } = await q
		.order('created_at', { ascending: false })
		.range(input.offset, to)

	if (error) {
		logDatabaseError('adminPanel:listReportsForAdmin', { status: input.status }, error)
		return {
			data: null,
			pagination: { total: 0, limit: input.limit, offset: input.offset, hasMore: false },
			error,
		}
	}

	const total = count ?? 0
	return {
		data: (rows ?? []) as ReportRow[],
		pagination: {
			total,
			limit: input.limit,
			offset: input.offset,
			hasMore: total > input.offset + input.limit,
		},
		error: null,
	}
}

/**
 * Single transaction: update report + append audit row (see migration `admin_resolve_report_atomic`).
 */
export async function rpcAdminResolveReport(
	actorId: string,
	reportId: string,
	newStatus: Extract<ReportStatus, 'reviewed' | 'resolved' | 'dismissed'>,
): Promise<{ data: ReportRow | null; error: unknown }> {
	const { data, error } = await getAdmin().rpc('admin_resolve_report_atomic', {
		p_report_id: reportId,
		p_new_status: newStatus,
		p_actor_id: actorId,
	})

	if (error) {
		logDatabaseError('adminPanel:rpcAdminResolveReport', { reportId, newStatus }, error)
		return { data: null, error }
	}

	if (data === null || data === undefined) {
		return { data: null, error: new Error('RESOLVE_EMPTY') }
	}

	return { data: data as ReportRow, error: null }
}
