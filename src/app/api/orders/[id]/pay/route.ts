// ============================================================================
// POST /api/orders/[id]/pay — buyer initiates escrow hold + checkout URL
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { orderPayBodySchema } from '@/lib/features/orders'
import { initiateOrderPaymentForBuyer } from '@/lib/features/orders/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, orderPayBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await initiateOrderPaymentForBuyer(
			auth.user.id,
			idParse.data,
			validation.data.payment_method,
		)

		if (error) {
			const msg = error instanceof Error ? error.message : String(error)
			if (msg === 'NOT_FOUND') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
			if (msg === 'FORBIDDEN') {
				return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
			}
			if (msg === 'INVALID_STATE') {
				return NextResponse.json({ ok: false, error: 'Order is not awaiting payment' }, { status: 409 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to start payment' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/orders/[id]/pay' } })
		console.error('UNEXPECTED: POST /api/orders/[id]/pay', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
