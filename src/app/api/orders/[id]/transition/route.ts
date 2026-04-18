// ============================================================================
// POST /api/orders/[id]/transition — transition_order RPC as participant
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest, getBearerTokenFromRequest } from '@/lib/auth/auth'
import { transitionOrderBodySchema } from '@/lib/features/orders'
import {
	transitionOrderForParticipant,
	transitionOrderOutcomeToHttpPayload,
} from '@/lib/features/orders/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
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

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, transitionOrderBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const result = await transitionOrderForParticipant(
			token,
			auth.user.id,
			idParse.data,
			validation.data.new_status,
			validation.data.metadata,
		)

		const { status: httpStatus, body: jsonBody } = transitionOrderOutcomeToHttpPayload(result)
		return NextResponse.json(jsonBody, { status: httpStatus })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/orders/[id]/transition' } })
		console.error('UNEXPECTED: POST /api/orders/[id]/transition', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
