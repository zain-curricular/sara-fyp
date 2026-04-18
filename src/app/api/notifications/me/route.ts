// ============================================================================
// GET /api/notifications/me — paginated inbox (optional unread-first sort)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import {
	listMyNotifications,
	NOTIFICATIONS_REALTIME_HINT,
	notificationsMeQuerySchema,
} from '@/lib/features/notifications/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const { searchParams } = new URL(request.url)
		const queryResult = notificationsMeQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { page, limit, unread_first: unreadFirst } = queryResult.data
		const { data, error, pagination } = await listMyNotifications({
			userId: auth.user.id,
			page,
			limit,
			unreadFirst,
		})

		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load notifications' }, { status: 500 })
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
				realtime: NOTIFICATIONS_REALTIME_HINT,
			},
			{ status: 200 },
		)
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/notifications/me' } })
		console.error('UNEXPECTED: GET /api/notifications/me', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
