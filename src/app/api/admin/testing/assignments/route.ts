// ============================================================================
// POST /api/admin/testing/assignments — assign a tester to an order
// ============================================================================

import { NextResponse } from 'next/server'

import {
	assignOrderToTester,
	assignTesterBodySchema,
	authenticateAndAuthorizeAdmin,
} from '@/lib/features/device-testing/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request) {
	try {
		const auth = await authenticateAndAuthorizeAdmin(request)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, assignTesterBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await assignOrderToTester({
			orderId: validation.data.order_id,
			testerId: validation.data.tester_id,
		})

		if (error) {
			const msg = error instanceof Error ? error.message : String(error)
			if (msg === 'NOT_FOUND') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
			if (msg === 'INVALID_TESTER') {
				return NextResponse.json({ ok: false, error: 'Invalid tester' }, { status: 400 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to assign tester' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/admin/testing/assignments' } })
		console.error('UNEXPECTED: POST /api/admin/testing/assignments', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
