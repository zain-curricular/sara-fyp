// ============================================================================
// GET /api/recommendations/trending — pre-ranked ids from mv_trending_listings
// ============================================================================

import { NextResponse } from 'next/server'

import { trendingQuerySchema } from '@/lib/features/recommendations'
import { listTrending } from '@/lib/features/recommendations/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const queryResult = trendingQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { data, error } = await listTrending(queryResult.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load trending listings' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/recommendations/trending' } })
		console.error('UNEXPECTED: GET /api/recommendations/trending', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
