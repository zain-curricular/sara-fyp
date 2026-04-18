// ============================================================================
// GET /api/notifications/me/unread-count
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { countUnreadForUser } from '@/lib/features/notifications/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(_request: Request) {
	try {
		const auth = await authenticateFromRequest(_request)
		if (auth.error) {
			return auth.error
		}

		const { count, error } = await countUnreadForUser(auth.user.id)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to count unread notifications' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: { unread_count: count } }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/notifications/me/unread-count' } })
		console.error('UNEXPECTED: GET /api/notifications/me/unread-count', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
