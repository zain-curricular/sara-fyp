// ============================================================================
// POST /api/listings/[id]/publish — activate listing (subscription limit)
// ============================================================================

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { publishListing, ListingServiceError } from '@/lib/features/listings/core/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'

/**
 * Publishes a draft listing (`active` + `published_at`).
 */
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

		const { data, error } = await publishListing(idParse.data, auth.user.id)
		if (error instanceof ListingServiceError) {
			if (error.code === 'LISTING_LIMIT_REACHED') {
				return NextResponse.json({ ok: false, error: 'Listing limit reached' }, { status: 400 })
			}
			if (error.code === 'NOT_FOUND' || error.code === 'INVALID_STATUS') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
		}
		if (error || !data) {
			return NextResponse.json({ ok: false, error: 'Failed to publish listing' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/listings/[id]/publish' } })
		console.error('UNEXPECTED: POST /api/listings/[id]/publish', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
