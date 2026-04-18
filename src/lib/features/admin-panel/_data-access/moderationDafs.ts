// ============================================================================
// Admin Panel — moderation reports DAFs
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import type { Database, ReportRow, ReportStatus } from '@/lib/supabase/database.types'

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

export async function getReportById(
	id: string,
): Promise<{ data: ReportRow | null; error: unknown }> {
	const { data, error } = await getAdmin().from('reports').select('*').eq('id', id).maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('adminPanel:getReportById', { id }, error)
	}
	return { data: data as ReportRow | null, error: isNotFoundError(error) ? null : error }
}

export async function updateReportById(
	id: string,
	patch: Pick<Database['public']['Tables']['reports']['Update'], 'status' | 'resolved_by' | 'resolved_at'>,
): Promise<{ data: ReportRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('reports')
		.update(patch)
		.eq('id', id)
		.select('*')
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('adminPanel:updateReportById', { id }, error)
	}
	return { data: data as ReportRow | null, error: isNotFoundError(error) ? null : error }
}
