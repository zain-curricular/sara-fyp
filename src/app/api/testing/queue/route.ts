// ============================================================================
// GET /api/testing/queue — orders assigned to the authenticated tester
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateAndAuthorizeTester, listTesterQueue } from '@/lib/features/device-testing/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request) {
	try {
		const auth = await authenticateAndAuthorizeTester(request)
		if (auth.error) {
			return auth.error
		}

		const { data, error } = await listTesterQueue(auth.user.id)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load queue' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/testing/queue' } })
		console.error('UNEXPECTED: GET /api/testing/queue', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
