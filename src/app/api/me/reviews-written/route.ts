// ============================================================================
// GET /api/me/reviews-written
// ============================================================================
//
// Authenticated: reviews authored by the signed-in user.

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { reviewsListQuerySchema } from '@/lib/features/reviews'
import { listMyReviewsWritten } from '@/lib/features/reviews/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const { searchParams } = new URL(request.url)
		const queryResult = reviewsListQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { page, limit } = queryResult.data
		const { data, error, pagination } = await listMyReviewsWritten(auth.user.id, page, limit)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load reviews' }, { status: 500 })
		}

		return NextResponse.json(
			{
				ok: true,
				data: data ?? [],
				pagination: pagination ?? {
					total: 0,
					limit,
					offset: (page - 1) * limit,
					hasMore: false,
				},
			},
			{ status: 200 },
		)
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/me/reviews-written' } })
		console.error('UNEXPECTED: GET /api/me/reviews-written', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
