// ============================================================================
// POST /api/notifications/read-all — mark all unread notifications read
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { markAllNotificationsRead } from '@/lib/features/notifications/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(_request: Request) {
	try {
		const auth = await authenticateFromRequest(_request)
		if (auth.error) {
			return auth.error
		}

		const { marked, error } = await markAllNotificationsRead(auth.user.id)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to mark notifications read' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: { marked } }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/notifications/read-all' } })
		console.error('UNEXPECTED: POST /api/notifications/read-all', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
