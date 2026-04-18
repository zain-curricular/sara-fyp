// ============================================================================
// POST /api/testing/reports — create draft test report for an assigned order
// ============================================================================

import { NextResponse } from 'next/server'

import {
	authenticateAndAuthorizeTester,
	createTestReport,
	createTestReportBodySchema,
} from '@/lib/features/device-testing/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request) {
	try {
		const auth = await authenticateAndAuthorizeTester(request)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, createTestReportBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await createTestReport({
			testerId: auth.user.id,
			orderId: validation.data.order_id,
		})

		if (error) {
			const msg = error instanceof Error ? error.message : String(error)
			if (msg === 'NOT_FOUND') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
			if (msg === 'FORBIDDEN') {
				return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
			}
			if (msg === 'INVALID_ORDER_STATE') {
				return NextResponse.json({ ok: false, error: 'Order is not in a testable state' }, { status: 409 })
			}
			if (msg === 'DUPLICATE') {
				return NextResponse.json({ ok: false, error: 'Report already exists for this order' }, { status: 409 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to create report' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 201 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/testing/reports' } })
		console.error('UNEXPECTED: POST /api/testing/reports', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
