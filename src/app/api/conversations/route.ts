// ============================================================================
// POST /api/conversations — buyer opens or retrieves thread for a listing
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import {
	createConversationBodySchema,
	messagingMutationErrorToHttp,
	openOrGetConversation,
} from '@/lib/features/messaging/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, createConversationBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await openOrGetConversation({
			buyerUserId: auth.user.id,
			listingId: validation.data.listing_id,
		})

		if (error) {
			const { status, body: errBody } = messagingMutationErrorToHttp(error)
			return NextResponse.json(errBody, { status })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/conversations' } })
		console.error('UNEXPECTED: POST /api/conversations', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
