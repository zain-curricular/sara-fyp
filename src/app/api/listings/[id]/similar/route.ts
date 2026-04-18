// ============================================================================
// GET /api/listings/[id]/similar — category + price-band similarity (SQL)
// ============================================================================

import { NextResponse } from 'next/server'

import { similarListingsQuerySchema } from '@/lib/features/recommendations'
import { listSimilarForListing } from '@/lib/features/recommendations/services'
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
		const queryResult = similarListingsQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { data, error } = await listSimilarForListing(idParse.data, queryResult.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load similar listings' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/listings/[id]/similar' } })
		console.error('UNEXPECTED: GET /api/listings/[id]/similar', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
