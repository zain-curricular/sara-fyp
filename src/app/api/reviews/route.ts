// ============================================================================
// POST /api/reviews
// ============================================================================
//
// Authenticated: post a review for the counterparty on a completed order.

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { postReviewSchema } from '@/lib/features/reviews'
import { postReview } from '@/lib/features/reviews/services'
import { isPostgresUniqueViolation } from '@/lib/utils/isPostgresUniqueViolation'
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
		const validation = validateRequestBody(body, postReviewSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await postReview(auth.user.id, validation.data)
		if (error) {
			const msg = error instanceof Error ? error.message : String(error)
			if (msg === 'NOT_FOUND') {
				return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })
			}
			if (msg === 'ORDER_NOT_COMPLETED') {
				return NextResponse.json(
					{ ok: false, error: 'Order must be completed before leaving a review' },
					{ status: 400 },
				)
			}
			if (msg === 'NOT_A_PARTICIPANT') {
				return NextResponse.json({ ok: false, error: 'Not a participant in this order' }, { status: 403 })
			}
			if (isPostgresUniqueViolation(error)) {
				return NextResponse.json(
					{ ok: false, error: 'You already reviewed this order' },
					{ status: 409 },
				)
			}
			return NextResponse.json({ ok: false, error: 'Failed to post review' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 201 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/reviews' } })
		console.error('UNEXPECTED: POST /api/reviews', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
