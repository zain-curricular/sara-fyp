// ============================================================================
// GET /api/orders/me — orders where caller is buyer or seller
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { listOrdersForCurrentUser } from '@/lib/features/orders/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const { data, error } = await listOrdersForCurrentUser(auth.user.id)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load orders' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/orders/me' } })
		console.error('UNEXPECTED: GET /api/orders/me', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
