// ============================================================================
// GET/PUT /api/listings/[id]/auto-bid — current user’s auto-bid ceiling
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { upsertAutoBidBodySchema } from '@/lib/features/auctions'
import { getAutoBidForUserListing, upsertAutoBidForBuyer } from '@/lib/features/auctions/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
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

		const { data, error } = await getAutoBidForUserListing(auth.user.id, idParse.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load auto-bid' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: data ?? null }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/listings/[id]/auto-bid' } })
		console.error('UNEXPECTED: GET /api/listings/[id]/auto-bid', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}

export async function PUT(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
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
		const validation = validateRequestBody(body, upsertAutoBidBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await upsertAutoBidForBuyer(auth.user.id, idParse.data, validation.data.max_amount)
		if (error) {
			const msg = error instanceof Error ? error.message : String(error)
			if (msg === 'NOT_FOUND') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
			if (msg === 'CANNOT_AUTO_BID_OWN_LISTING') {
				return NextResponse.json({ ok: false, error: 'Cannot set auto-bid on your own listing' }, {
					status: 403,
				})
			}
			if (msg === 'NOT_AUCTION_LISTING') {
				return NextResponse.json({ ok: false, error: 'Not an auction listing' }, { status: 400 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to save auto-bid' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'PUT /api/listings/[id]/auto-bid' } })
		console.error('UNEXPECTED: PUT /api/listings/[id]/auto-bid', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
