// ============================================================================
// GET /api/recommendations/for-me — personalised feed (auth; affinity or cold-start)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { forMeQuerySchema } from '@/lib/features/recommendations'
import { listForMe } from '@/lib/features/recommendations/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const { searchParams } = new URL(request.url)
		const queryResult = forMeQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { data, error } = await listForMe(auth.user.id, queryResult.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load recommendations' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/recommendations/for-me' } })
		console.error('UNEXPECTED: GET /api/recommendations/for-me', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
