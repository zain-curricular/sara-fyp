// ============================================================================
// POST /api/subscriptions/checkout
// ============================================================================
//
// Authenticated seller: create pending subscription payment (escrow hold stub).

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { subscriptionCheckoutBodySchema } from '@/lib/features/subscriptions'
import { startSubscriptionCheckout } from '@/lib/features/subscriptions/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, subscriptionCheckoutBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await startSubscriptionCheckout(auth.user.id, validation.data.target_tier)
		if (error) {
			const msg = error instanceof Error ? error.message : String(error)
			if (msg === 'INVALID_TIER') {
				return NextResponse.json({ ok: false, error: 'Invalid subscription tier' }, { status: 400 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to start checkout' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/subscriptions/checkout' } })
		console.error('UNEXPECTED: POST /api/subscriptions/checkout', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
