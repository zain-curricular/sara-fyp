// ============================================================================
// POST /api/testing/reports/[id]/submit — finalize verdict + transition order
// ============================================================================

import { NextResponse } from 'next/server'

import {
	authenticateAndAuthorizeTester,
	submitTestReport,
	submitTestReportBodySchema,
} from '@/lib/features/device-testing/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await authenticateAndAuthorizeTester(request)
		if (auth.error) {
			return auth.error
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, submitTestReportBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await submitTestReport({
			reportId: idParse.data,
			testerId: auth.user.id,
			overall_score: validation.data.overall_score,
			overall_notes: validation.data.overall_notes ?? null,
			passed: validation.data.passed,
		})

		if (error) {
			const msg = error instanceof Error ? error.message : String(error)
			if (msg === 'NOT_FOUND') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
			if (msg === 'FORBIDDEN') {
				return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
			}
			if (msg === 'ALREADY_SUBMITTED') {
				return NextResponse.json({ ok: false, error: 'Report already submitted' }, { status: 409 })
			}
			if (msg === 'INVALID_ORDER_STATE') {
				return NextResponse.json(
					{ ok: false, error: 'Order must be under testing to submit' },
					{ status: 409 },
				)
			}
			if (msg.startsWith('VALIDATION:')) {
				return NextResponse.json(
					{ ok: false, error: 'Validation failed', details: msg.replace(/^VALIDATION:/, '') },
					{ status: 400 },
				)
			}
			if (msg === 'TRANSITION_FAILED') {
				return NextResponse.json({ ok: false, error: 'Failed to update order status' }, { status: 500 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to submit report' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/testing/reports/[id]/submit' } })
		console.error('UNEXPECTED: POST /api/testing/reports/[id]/submit', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
