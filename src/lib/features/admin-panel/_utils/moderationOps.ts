// ============================================================================
// Admin Panel — moderation orchestration (report + audit log)
// ============================================================================

import 'server-only'

import type { ReportRow, ReportStatus } from '@/lib/supabase/database.types'

import { insertAdminAuditLog } from '../_data-access/auditLogDafs'
import {
	getReportById,
	listReportsForAdmin,
	updateReportById,
	type PaginatedReports,
} from '../_data-access/moderationDafs'
import type { AdminModerationReportsQuery, AdminResolveReportBody } from '../schemas'

export async function listReportQueue(
	query: AdminModerationReportsQuery,
): Promise<PaginatedReports> {
	return listReportsForAdmin({
		status: query.status,
		limit: query.limit,
		offset: query.offset,
	})
}

export async function resolveReport(
	adminUserId: string,
	reportId: string,
	body: AdminResolveReportBody,
): Promise<{ data: ReportRow | null; error: unknown }> {
	const { data: existing, error: gErr } = await getReportById(reportId)
	if (gErr) {
		return { data: null, error: gErr }
	}
	if (!existing) {
		return { data: null, error: new Error('NOT_FOUND') }
	}

	const status = body.status as ReportStatus
	const resolvedAt = new Date().toISOString()

	const { data: updated, error: uErr } = await updateReportById(reportId, {
		status,
		resolved_by: adminUserId,
		resolved_at: resolvedAt,
	})
	if (uErr || !updated) {
		return { data: null, error: uErr ?? new Error('UPDATE_FAILED') }
	}

	const { error: aErr } = await insertAdminAuditLog({
		actorId: adminUserId,
		action: 'resolve_report',
		targetType: 'report',
		targetId: reportId,
		metadata: {
			previous_status: existing.status,
			new_status: status,
		},
	})
	if (aErr) {
		return { data: updated, error: aErr }
	}

	return { data: updated, error: null }
}
