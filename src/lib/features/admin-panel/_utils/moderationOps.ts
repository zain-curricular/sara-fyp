// ============================================================================
// Admin Panel — moderation orchestration (report + audit log)
// ============================================================================

import 'server-only'

import * as Sentry from '@sentry/nextjs'

import type { ReportRow } from '@/lib/supabase/database.types'
import { serializeError } from '@/lib/utils/serializeError'

import {
	listReportsForAdmin,
	rpcAdminResolveReport,
	type PaginatedReports,
} from '../_data-access/moderationDafs'
import type { AdminModerationReportsQuery, AdminResolveReportBody } from '../schemas'

function rpcMessage(error: unknown): string {
	if (error && typeof error === 'object' && 'message' in error) {
		return String((error as { message: string }).message)
	}
	return ''
}

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
	const { data, error } = await rpcAdminResolveReport(adminUserId, reportId, body.status)

	if (!error && data) {
		return { data, error: null }
	}

	const msg = rpcMessage(error)
	if (msg.includes('REPORT_NOT_FOUND')) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	if (msg.includes('ACTOR_NOT_ADMIN')) {
		return { data: null, error: new Error('FORBIDDEN') }
	}
	if (msg.includes('INVALID_RESOLVE_STATUS')) {
		return { data: null, error: new Error('INVALID_STATUS') }
	}

	console.error('adminPanel:resolveReport rpc failed', {
		reportId,
		error: serializeError(error),
	})
	Sentry.captureException(error instanceof Error ? error : new Error('admin_resolve_report_atomic failed'), {
		extra: { reportId, adminUserId, message: msg },
	})
	return { data: null, error: error ?? new Error('RESOLVE_FAILED') }
}
