// ============================================================================
// GET /api/conversations/[id] — single thread (participant)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import {
	getConversationForParticipant,
	messagingMutationErrorToHttp,
	MESSAGING_REALTIME_HINT,
} from '@/lib/features/messaging/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
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

		const { data, error } = await getConversationForParticipant(auth.user.id, idParse.data)
		if (error) {
			const { status, body } = messagingMutationErrorToHttp(error)
			return NextResponse.json(body, { status })
		}

		return NextResponse.json(
			{ ok: true, data, realtime: MESSAGING_REALTIME_HINT },
			{ status: 200 },
		)
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/conversations/[id]' } })
		console.error('UNEXPECTED: GET /api/conversations/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
