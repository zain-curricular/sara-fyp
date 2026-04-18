// ============================================================================
// POST /api/admin/ai/listings/[id]/regenerate-rating — AI rating (admin)
// ============================================================================

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

import { ListingServiceError } from '@/lib/features/listings/core/services'
import { authenticateAndAuthorizeAdminListing } from '@/lib/features/listings/shared/services'
import { regenerateAiRatingForListing, aiErrorToHttp, AiError } from '@/lib/features/ai-engine/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'

const postBodySchema = z.object({}).strict()

export async function POST(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const body = await request.json().catch(() => ({}))
		const bodyParse = validateRequestBody(body, postBodySchema)
		if (isValidationError(bodyParse)) {
			return bodyParse.error
		}

		const auth = await authenticateAndAuthorizeAdminListing(request, idParse.data)
		if (auth.error) {
			return auth.error
		}

		const { data, error } = await regenerateAiRatingForListing({
			listingId: auth.listing.id,
			adminUserId: auth.user.id,
		})

		if (error instanceof ListingServiceError) {
			if (error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to regenerate rating' }, { status: 500 })
		}
		if (AiError.isAiError(error)) {
			const http = aiErrorToHttp(error)
			return NextResponse.json(http.body, { status: http.status })
		}
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to regenerate rating' }, { status: 500 })
		}
		if (!data) {
			return NextResponse.json({ ok: false, error: 'Failed to regenerate rating' }, { status: 500 })
		}

		return NextResponse.json(
			{ ok: true, data: { rating: data.rating, listing: data.listing } },
			{ status: 200 },
		)
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/admin/ai/listings/[id]/regenerate-rating' } })
		console.error('UNEXPECTED: POST /api/admin/ai/listings/[id]/regenerate-rating', {
			error: serializeError(error),
		})
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
