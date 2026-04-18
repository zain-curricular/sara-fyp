// ============================================================================
// POST /api/notifications/[id]/read — mark one notification read
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import {
	markNotificationRead,
	notificationsMutationErrorToHttp,
} from '@/lib/features/notifications/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const { data, error } = await markNotificationRead({
			userId: auth.user.id,
			notificationId: idParse.data,
		})

		if (error) {
			const { status, body } = notificationsMutationErrorToHttp(error)
			return NextResponse.json(body, { status })
		}

		return NextResponse.json({ ok: true, data: data ?? { id: idParse.data } }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/notifications/[id]/read' } })
		console.error('UNEXPECTED: POST /api/notifications/[id]/read', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
