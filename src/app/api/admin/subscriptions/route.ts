// ============================================================================
// POST /api/admin/subscriptions
// ============================================================================
//
// Admin: assign or replace a user’s subscription tier.

import { NextResponse } from 'next/server'

import { authenticateAdmin } from '@/lib/features/profiles/services'
import { adminCreateSubscriptionSchema } from '@/lib/features/subscriptions'
import { adminCreateSubscription } from '@/lib/features/subscriptions/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request) {
	try {
		const auth = await authenticateAdmin(request)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, adminCreateSubscriptionSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await adminCreateSubscription(validation.data)
		if (error) {
			const msg = error instanceof Error ? error.message : String(error)
			if (msg === 'UNKNOWN_TIER') {
				return NextResponse.json({ ok: false, error: 'Invalid tier' }, { status: 400 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to create subscription' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 201 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/admin/subscriptions' } })
		console.error('UNEXPECTED: POST /api/admin/subscriptions', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
