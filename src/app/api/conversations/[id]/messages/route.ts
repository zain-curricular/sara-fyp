// ============================================================================
// GET/POST /api/conversations/[id]/messages — list or send (participant)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import {
	listMessagesForParticipant,
	messagingMutationErrorToHttp,
	sendMessage,
	sendMessageBodySchema,
	messagesListQuerySchema,
} from '@/lib/features/messaging/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
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

		const { searchParams } = new URL(request.url)
		const queryResult = messagesListQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { page, limit } = queryResult.data
		const { data, error, pagination } = await listMessagesForParticipant({
			userId: auth.user.id,
			conversationId: idParse.data,
			page,
			limit,
		})

		if (error) {
			const { status, body } = messagingMutationErrorToHttp(error)
			return NextResponse.json(body, { status })
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
			},
			{ status: 200 },
		)
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/conversations/[id]/messages' } })
		console.error('UNEXPECTED: GET /api/conversations/[id]/messages', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}

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

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, sendMessageBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await sendMessage({
			userId: auth.user.id,
			conversationId: idParse.data,
			content: validation.data.content,
		})

		if (error) {
			const { status, body: errBody } = messagingMutationErrorToHttp(error)
			return NextResponse.json(errBody, { status })
		}

		return NextResponse.json({ ok: true, data }, { status: 201 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/conversations/[id]/messages' } })
		console.error('UNEXPECTED: POST /api/conversations/[id]/messages', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
