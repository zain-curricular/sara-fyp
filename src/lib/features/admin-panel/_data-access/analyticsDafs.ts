// ============================================================================
// Admin Panel — analytics DAFs (MV + live aggregates)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import type { MvAdminDailyStatsRow, ReportRow } from '@/lib/supabase/database.types'

export async function fetchMvAdminDailyStatsInRange(
	fromDate: string,
	toDate: string,
): Promise<{ data: MvAdminDailyStatsRow[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('mv_admin_daily_stats')
		.select('*')
		.gte('stat_date', fromDate)
		.lte('stat_date', toDate)
		.order('stat_date', { ascending: true })

	if (error) {
		logDatabaseError('adminPanel:fetchMvAdminDailyStatsInRange', { fromDate, toDate }, error)
	}
	return { data: data as MvAdminDailyStatsRow[] | null, error }
}

export async function countReportsByStatus(
	status: ReportRow['status'],
): Promise<{ data: number; error: unknown }> {
	const { count, error } = await getAdmin()
		.from('reports')
		.select('id', { count: 'exact', head: true })
		.eq('status', status)

	if (error) {
		logDatabaseError('adminPanel:countReportsByStatus', { status }, error)
		return { data: 0, error }
	}
	return { data: count ?? 0, error: null }
}

export async function fetchResolvedReportsForAvgResolution(
	limit: number,
): Promise<{ data: Pick<ReportRow, 'created_at' | 'resolved_at'>[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('reports')
		.select('created_at, resolved_at')
		.not('resolved_at', 'is', null)
		.in('status', ['resolved', 'dismissed'])
		.limit(limit)

	if (error) {
		logDatabaseError('adminPanel:fetchResolvedReportsForAvgResolution', {}, error)
	}
	return { data: data as Pick<ReportRow, 'created_at' | 'resolved_at'>[] | null, error }
}

export async function countFlaggedListings(): Promise<{ data: number; error: unknown }> {
	const { count, error } = await getAdmin()
		.from('listings')
		.select('id', { count: 'exact', head: true })
		.eq('status', 'flagged')

	if (error) {
		logDatabaseError('adminPanel:countFlaggedListings', {}, error)
		return { data: 0, error }
	}
	return { data: count ?? 0, error: null }
}
