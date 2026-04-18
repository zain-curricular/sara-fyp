// ============================================================================
// Device testing — create / update / submit reports + photo upload
// ============================================================================

import * as Sentry from '@sentry/nextjs'

import { getListingById } from '@/lib/features/listings/core/services'
import { getOrderById } from '@/lib/features/orders/services'
import {
	parseTransitionOrderRpcPayload,
	transitionOrderWithServiceRole,
} from '@/lib/features/orders/services'
import { getCategoryById } from '@/lib/features/product-catalog/services'
import type { Json } from '@/lib/supabase/database.types'
import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { serializeError } from '@/lib/utils/serializeError'

import {
	getTestReportById,
	getTestReportByOrderId,
	insertTestReport,
	updateTestReportById,
} from '../_data-access/reportsDafs'
import { validateInspectionResultsAgainstSchema } from './validateInspectionResults'

const REPORT_ALLOWED_ORDER_STATUSES: readonly string[] = ['payment_received', 'shipped_to_center', 'under_testing']

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isPostgresUniqueViolation(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		(error as { code: string }).code === '23505'
	)
}

export async function createTestReport(input: {
	testerId: string
	orderId: string
}): Promise<{ data: { id: string } | null; error: unknown }> {
	const { data: order, error: oErr } = await getOrderById(input.orderId)
	if (oErr) {
		return { data: null, error: oErr }
	}
	if (!order) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	if (order.assigned_tester_id !== input.testerId) {
		return { data: null, error: new Error('FORBIDDEN') }
	}
	if (!REPORT_ALLOWED_ORDER_STATUSES.includes(order.status)) {
		return { data: null, error: new Error('INVALID_ORDER_STATE') }
	}

	const { data: existing } = await getTestReportByOrderId(input.orderId)
	if (existing) {
		return { data: null, error: new Error('DUPLICATE') }
	}

	const { data: row, error: iErr } = await insertTestReport({
		order_id: input.orderId,
		tester_id: input.testerId,
		inspection_results: {} as Json,
	})
	if (iErr) {
		if (isPostgresUniqueViolation(iErr)) {
			return { data: null, error: new Error('DUPLICATE') }
		}
		return { data: null, error: iErr }
	}
	if (!row) {
		return { data: null, error: new Error('INSERT_FAILED') }
	}
	return { data: { id: row.id }, error: null }
}

export async function updateTestReportDraft(input: {
	reportId: string
	testerId: string
	inspection_results?: Record<string, unknown>
	overall_score?: number
	overall_notes?: string | null
}): Promise<{ data: { id: string } | null; error: unknown }> {
	const { data: report, error: rErr } = await getTestReportById(input.reportId)
	if (rErr) {
		return { data: null, error: rErr }
	}
	if (!report) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	if (report.tester_id !== input.testerId) {
		return { data: null, error: new Error('FORBIDDEN') }
	}
	if (report.passed !== null) {
		return { data: null, error: new Error('ALREADY_SUBMITTED') }
	}

	const { data: order } = await getOrderById(report.order_id)
	if (!order || order.assigned_tester_id !== input.testerId) {
		return { data: null, error: new Error('FORBIDDEN') }
	}

	let mergedResults = report.inspection_results as unknown
	if (input.inspection_results !== undefined) {
		const base = isRecord(report.inspection_results as unknown)
			? { ...(report.inspection_results as Record<string, unknown>) }
			: {}
		mergedResults = { ...base, ...input.inspection_results }
	}

	if (mergedResults !== undefined && input.inspection_results !== undefined) {
		const { data: listing } = await getListingById(order.listing_id)
		if (!listing) {
			return { data: null, error: new Error('LISTING_NOT_FOUND') }
		}
		const { data: category } = await getCategoryById(listing.category_id)
		if (!category) {
			return { data: null, error: new Error('CATEGORY_NOT_FOUND') }
		}
		const schema = category.inspection_schema as Record<string, unknown>
		if (Object.keys(schema).length > 0) {
			const v = validateInspectionResultsAgainstSchema(schema, mergedResults)
			if (!v.ok) {
				return { data: null, error: new Error(`VALIDATION:${v.errors.join('; ')}`) }
			}
			mergedResults = v.data
		}
	}

	const { data: updated, error: uErr } = await updateTestReportById(input.reportId, {
		...(mergedResults !== undefined ? { inspection_results: mergedResults as Json } : {}),
		...(input.overall_score !== undefined ? { overall_score: input.overall_score } : {}),
		...(input.overall_notes !== undefined ? { overall_notes: input.overall_notes } : {}),
	})
	if (uErr || !updated) {
		return { data: null, error: uErr ?? new Error('UPDATE_FAILED') }
	}
	return { data: { id: updated.id }, error: null }
}

export async function submitTestReport(input: {
	reportId: string
	testerId: string
	overall_score: number
	overall_notes: string | null
	passed: boolean
}): Promise<{ data: { order_id: string } | null; error: unknown }> {
	const { data: report, error: rErr } = await getTestReportById(input.reportId)
	if (rErr) {
		return { data: null, error: rErr }
	}
	if (!report) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	if (report.tester_id !== input.testerId) {
		return { data: null, error: new Error('FORBIDDEN') }
	}
	if (report.passed !== null) {
		return { data: null, error: new Error('ALREADY_SUBMITTED') }
	}

	const { data: order, error: oErr } = await getOrderById(report.order_id)
	if (oErr) {
		return { data: null, error: oErr }
	}
	if (!order) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	if (order.assigned_tester_id !== input.testerId) {
		return { data: null, error: new Error('FORBIDDEN') }
	}
	if (order.status !== 'under_testing') {
		return { data: null, error: new Error('INVALID_ORDER_STATE') }
	}

	const { data: listing } = await getListingById(order.listing_id)
	if (!listing) {
		return { data: null, error: new Error('LISTING_NOT_FOUND') }
	}
	const { data: category } = await getCategoryById(listing.category_id)
	if (!category) {
		return { data: null, error: new Error('CATEGORY_NOT_FOUND') }
	}
	const schema = category.inspection_schema as Record<string, unknown>
	if (Object.keys(schema).length === 0) {
		return { data: null, error: new Error('INSPECTION_SCHEMA_NOT_CONFIGURED') }
	}
	const v = validateInspectionResultsAgainstSchema(schema, report.inspection_results)
	if (!v.ok) {
		return { data: null, error: new Error(`VALIDATION:${v.errors.join('; ')}`) }
	}

	const meta = { test_report_id: input.reportId, source: 'device_testing_submit' }

	const { data: tr1, error: e1 } = await transitionOrderWithServiceRole(
		report.order_id,
		'testing_complete',
		meta,
	)
	if (e1) {
		console.error('transition_order testing_complete failed', serializeError(e1))
		Sentry.captureException(e1 instanceof Error ? e1 : new Error('transition_order failed'), {
			extra: { orderId: report.order_id, step: 'testing_complete', ...meta },
		})
		return { data: null, error: e1 }
	}
	const p1 = parseTransitionOrderRpcPayload(tr1 as Json)
	if (!p1.ok) {
		Sentry.captureMessage('transition_order invalid (testing_complete)', {
			level: 'warning',
			extra: { orderId: report.order_id, message: p1.error, from: p1.from, to: p1.to },
		})
		return { data: null, error: new Error('TRANSITION_FAILED') }
	}

	const nextStatus = input.passed ? 'approved' : 'rejected'
	const { data: tr2, error: e2 } = await transitionOrderWithServiceRole(report.order_id, nextStatus, meta)
	if (e2) {
		console.error('transition_order post-testing failed', serializeError(e2))
		Sentry.captureException(e2 instanceof Error ? e2 : new Error('transition_order failed'), {
			level: 'fatal',
			extra: { orderId: report.order_id, step: nextStatus, ...meta },
			tags: { reconciliation_required: 'true' },
		})
		return { data: null, error: e2 }
	}
	const p2 = parseTransitionOrderRpcPayload(tr2 as Json)
	if (!p2.ok) {
		Sentry.captureMessage('transition_order invalid (post-testing)', {
			level: 'fatal',
			extra: {
				orderId: report.order_id,
				message: p2.error,
				from: p2.from,
				to: p2.to,
				expected: nextStatus,
			},
			tags: { reconciliation_required: 'true' },
		})
		return { data: null, error: new Error('TRANSITION_FAILED') }
	}

	const { error: uErr } = await updateTestReportById(input.reportId, {
		overall_score: input.overall_score,
		overall_notes: input.overall_notes,
		passed: input.passed,
	})
	if (uErr) {
		console.error('device_testing: persist verdict after transitions failed', serializeError(uErr))
		Sentry.captureMessage('device_testing: report verdict persist failed after successful transitions', {
			level: 'fatal',
			tags: { reconciliation_required: 'true' },
			extra: {
				orderId: report.order_id,
				reportId: input.reportId,
				error: serializeError(uErr),
			},
		})
		return { data: null, error: new Error('REPORT_PERSIST_FAILED') }
	}

	return { data: { order_id: report.order_id }, error: null }
}

const MIME_EXT: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
}

export async function addPhotoToReport(input: {
	reportId: string
	testerId: string
	criterionKey: string
	bytes: Uint8Array
	contentType: string
}): Promise<{ data: { path: string; signed_url: string | null } | null; error: unknown }> {
	const { data: report, error: rErr } = await getTestReportById(input.reportId)
	if (rErr) {
		return { data: null, error: rErr }
	}
	if (!report) {
		return { data: null, error: new Error('NOT_FOUND') }
	}
	if (report.tester_id !== input.testerId) {
		return { data: null, error: new Error('FORBIDDEN') }
	}
	if (report.passed !== null) {
		return { data: null, error: new Error('ALREADY_SUBMITTED') }
	}

	const ext = MIME_EXT[input.contentType]
	if (!ext) {
		return { data: null, error: new Error('INVALID_MIME') }
	}

	const orderId = report.order_id
	const path = `${orderId}/${crypto.randomUUID()}.${ext}`

	const bucket = getAdmin().storage.from('test-reports')

	const { error: upErr } = await bucket.upload(path, input.bytes, {
		contentType: input.contentType,
		upsert: false,
	})
	if (upErr) {
		return { data: null, error: upErr }
	}

	const { data: signed, error: signErr } = await bucket.createSignedUrl(path, 3600)

	if (signErr) {
		await bucket.remove([path])
		return { data: null, error: signErr }
	}

	const results = isRecord(report.inspection_results as unknown)
		? { ...(report.inspection_results as Record<string, unknown>) }
		: {}
	const crit = isRecord(results[input.criterionKey]) ? { ...(results[input.criterionKey] as Record<string, unknown>) } : {}
	const urls = Array.isArray(crit.photo_urls) ? [...(crit.photo_urls as unknown[])] : []
	urls.push(path)
	crit.photo_urls = urls
	results[input.criterionKey] = crit

	const { error: uErr } = await updateTestReportById(input.reportId, {
		inspection_results: results as unknown as Json,
	})
	if (uErr) {
		await bucket.remove([path])
		return { data: null, error: uErr }
	}

	return {
		data: { path, signed_url: signed?.signedUrl ?? null },
		error: null,
	}
}
