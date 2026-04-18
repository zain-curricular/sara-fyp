// ============================================================================
// GET/POST/PATCH /api/listings/[id]/auction
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import {
	createAuctionConfigBodySchema,
	patchAuctionConfigBodySchema,
} from '@/lib/features/auctions'
import {
	createAuctionConfigForSeller,
	getPublicAuctionDetailForListing,
	patchAuctionConfigForSeller,
} from '@/lib/features/auctions/services'
import { getClientIpFromRequest } from '@/lib/utils/clientIp'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { checkListingPublicReadRateLimit, isRateLimited } from '@/lib/utils/rateLimit'
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

		const { data, error } = await getPublicAuctionDetailForListing(idParse.data)
		if (error) {
			const msg = error instanceof Error ? error.message : String(error)
			if (msg === 'NOT_FOUND') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
			if (msg === 'NOT_AUCTION_LISTING') {
				return NextResponse.json({ ok: false, error: 'Not an auction listing' }, { status: 400 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to load auction' }, { status: 500 })
		}
		if (!data) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/listings/[id]/auction' } })
		console.error('UNEXPECTED: GET /api/listings/[id]/auction', { error: serializeError(error) })
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

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, createAuctionConfigBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await createAuctionConfigForSeller(auth.user.id, idParse.data, validation.data)
		if (error) {
			const msg = error instanceof Error ? error.message : String(error)
			if (msg === 'NOT_FOUND') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
			if (msg === 'FORBIDDEN') {
				return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
			}
			if (msg === 'NOT_AUCTION_LISTING') {
				return NextResponse.json({ ok: false, error: 'Listing is not an auction' }, { status: 400 })
			}
			if (msg === 'CONFIG_EXISTS') {
				return NextResponse.json({ ok: false, error: 'Auction config already exists' }, { status: 409 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to create auction config' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 201 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/listings/[id]/auction' } })
		console.error('UNEXPECTED: POST /api/listings/[id]/auction', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}

export async function PATCH(
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
		const validation = validateRequestBody(body, patchAuctionConfigBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await patchAuctionConfigForSeller(auth.user.id, idParse.data, validation.data)
		if (error) {
			const msg = error instanceof Error ? error.message : String(error)
			if (msg === 'NOT_FOUND') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
			if (msg === 'FORBIDDEN') {
				return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
			}
			if (msg === 'CONFIG_LOCKED') {
				return NextResponse.json({ ok: false, error: 'Auction config is locked after the first bid' }, {
					status: 409,
				})
			}
			if (msg === 'INVALID_AUCTION_WINDOW') {
				return NextResponse.json({ ok: false, error: 'Invalid auction start/end window' }, { status: 400 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to update auction config' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'PATCH /api/listings/[id]/auction' } })
		console.error('UNEXPECTED: PATCH /api/listings/[id]/auction', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
