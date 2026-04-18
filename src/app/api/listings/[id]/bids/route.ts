// ============================================================================
// GET/POST /api/listings/[id]/bids
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest, getBearerTokenFromRequest } from '@/lib/auth/auth'
import { placeBidBodySchema } from '@/lib/features/auctions'
import { getPublicBidFeed, placeBidOutcomeToHttpPayload, placeBidThroughApi } from '@/lib/features/auctions/services'
import { getListingById } from '@/lib/features/listings/core/services'
import { getClientIpFromRequest } from '@/lib/utils/clientIp'
import { checkListingPublicReadRateLimit, isRateLimited } from '@/lib/utils/rateLimit'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const rate = await checkListingPublicReadRateLimit(getClientIpFromRequest(request))
		if (isRateLimited(rate)) {
			return rate.error
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const { data: listing, error: lErr } = await getListingById(idParse.data)
		if (lErr) {
			return NextResponse.json({ ok: false, error: 'Failed to load listing' }, { status: 500 })
		}
		if (!listing || listing.deleted_at || listing.status !== 'active') {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}
		if (listing.sale_type !== 'auction' && listing.sale_type !== 'both') {
			return NextResponse.json({ ok: false, error: 'Not an auction listing' }, { status: 400 })
		}

		const { data, error } = await getPublicBidFeed(idParse.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load bids' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/listings/[id]/bids' } })
		console.error('UNEXPECTED: GET /api/listings/[id]/bids', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}

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
		const validation = validateRequestBody(body, placeBidBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const outcome = await placeBidThroughApi(token, idParse.data, validation.data.amount)
		const { status, body: resBody } = placeBidOutcomeToHttpPayload(outcome)
		return NextResponse.json(resBody, { status })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/listings/[id]/bids' } })
		console.error('UNEXPECTED: POST /api/listings/[id]/bids', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
