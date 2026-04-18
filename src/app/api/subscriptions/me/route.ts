// ============================================================================
// GET /api/subscriptions/me
// ============================================================================
//
// Authenticated seller: active plan + quota usage.

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { getMySubscription } from '@/lib/features/subscriptions/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const { data, error } = await getMySubscription(auth.user.id)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load subscription' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/subscriptions/me' } })
		console.error('UNEXPECTED: GET /api/subscriptions/me', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
