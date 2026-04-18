// ============================================================================
// GET /api/conversations/me — participant's threads + unread + realtime hint
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import {
	conversationsMeQuerySchema,
	listMyConversations,
	MESSAGING_REALTIME_HINT,
} from '@/lib/features/messaging/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const { searchParams } = new URL(request.url)
		const queryResult = conversationsMeQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { page, limit } = queryResult.data
		const { data, error, pagination } = await listMyConversations({
			userId: auth.user.id,
			page,
			limit,
		})

		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load conversations' }, { status: 500 })
		}

		return NextResponse.json(
			{
				ok: true,
				data: data ?? [],
				pagination: pagination ?? {
					total: 0,
					limit,
					offset: (page - 1) * limit,
					hasMore: false,
				},
				realtime: MESSAGING_REALTIME_HINT,
			},
			{ status: 200 },
		)
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/conversations/me' } })
		console.error('UNEXPECTED: GET /api/conversations/me', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
