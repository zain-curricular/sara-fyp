// ============================================================================
// GET /api/profiles/[id]/reviews
// ============================================================================
//
// Public: paginated reviews received by this profile.

import { NextResponse } from 'next/server'

import { reviewsListQuerySchema } from '@/lib/features/reviews'
import { listReviewsForUser } from '@/lib/features/reviews/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await context.params

		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const { searchParams } = new URL(request.url)
		const queryResult = reviewsListQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { limit, offset } = queryResult.data
		const { data, error } = await listReviewsForUser(idParse.data, { limit, offset })
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load reviews' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/profiles/[id]/reviews' } })
		console.error('UNEXPECTED: GET /api/profiles/[id]/reviews', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
