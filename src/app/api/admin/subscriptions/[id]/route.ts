// ============================================================================
// GET/PATCH /api/admin/subscriptions/[id]
// ============================================================================
//
// Admin: read or update a subscription row by primary key.

import { NextResponse } from 'next/server'

import { authenticateAdmin } from '@/lib/features/profiles/services'
import { adminPatchSubscriptionSchema } from '@/lib/features/subscriptions'
import { adminPatchSubscription, getSubscriptionById } from '@/lib/features/subscriptions/services'
import { uuidValidation } from '@/lib/validation'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await authenticateAdmin(request)
		if (auth.error) {
			return auth.error
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const { data, error } = await getSubscriptionById(idParse.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load subscription' }, { status: 500 })
		}
		if (!data) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/admin/subscriptions/[id]' } })
		console.error('UNEXPECTED: GET /api/admin/subscriptions/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}

export async function PATCH(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await authenticateAdmin(request)
		if (auth.error) {
			return auth.error
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, adminPatchSubscriptionSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await adminPatchSubscription(idParse.data, validation.data)
		if (error) {
			const msg = error instanceof Error ? error.message : String(error)
			if (msg === 'NOT_FOUND') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
			if (msg === 'UNKNOWN_TIER') {
				return NextResponse.json({ ok: false, error: 'Invalid tier' }, { status: 400 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to update subscription' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'PATCH /api/admin/subscriptions/[id]' } })
		console.error('UNEXPECTED: PATCH /api/admin/subscriptions/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
