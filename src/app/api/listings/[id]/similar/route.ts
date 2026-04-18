// ============================================================================
// GET /api/listings/[id]/similar — category + price-band similarity (SQL)
// ============================================================================
//
// Returns 404 when no listing row exists for `id`. Inactive or soft-deleted
// source listings return 200 with an empty `data` array.

import { NextResponse } from 'next/server'

import { similarListingsQuerySchema } from '@/lib/features/recommendations'
import { listSimilarForListing } from '@/lib/features/recommendations/services'
import { getClientIpFromRequest } from '@/lib/utils/clientIp'
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

		const { searchParams } = new URL(request.url)
		const queryResult = similarListingsQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { data, error, listingNotFound } = await listSimilarForListing(idParse.data, queryResult.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load similar listings' }, { status: 500 })
		}
		if (listingNotFound) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/listings/[id]/similar' } })
		console.error('UNEXPECTED: GET /api/listings/[id]/similar', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
