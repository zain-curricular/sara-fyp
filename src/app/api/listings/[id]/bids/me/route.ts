// ============================================================================
// GET /api/listings/[id]/bids/me — authenticated bidder’s bids on this listing
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { getMyBidsOnListing } from '@/lib/features/auctions/services'
import { getListingById } from '@/lib/features/listings/core/services'
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

		const { data, error } = await getMyBidsOnListing(auth.user.id, idParse.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load bids' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/listings/[id]/bids/me' } })
		console.error('UNEXPECTED: GET /api/listings/[id]/bids/me', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
