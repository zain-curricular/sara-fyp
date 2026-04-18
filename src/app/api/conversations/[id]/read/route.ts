// ============================================================================
// POST /api/conversations/[id]/read — mark peer messages read (RPC + JWT)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest, getBearerTokenFromRequest } from '@/lib/auth/auth'
import {
	markConversationRead,
	messagingMutationErrorToHttp,
} from '@/lib/features/messaging/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const token = getBearerTokenFromRequest(request)
		if (!token) {
			return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const { data, error } = await markConversationRead({
			userId: auth.user.id,
			conversationId: idParse.data,
			accessToken: token,
		})

		if (error) {
			const { status, body } = messagingMutationErrorToHttp(error)
			return NextResponse.json(body, { status })
		}

		return NextResponse.json({ ok: true, data: data ?? { ok: true } }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/conversations/[id]/read' } })
		console.error('UNEXPECTED: POST /api/conversations/[id]/read', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
