// ============================================================================
// GET /api/listings  — public search
// POST /api/listings — create draft (auth)
// ============================================================================

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { createListingSchema, listingsSearchQuerySchema } from '@/lib/features/listings'
import { createDraftListing, ListingServiceError } from '@/lib/features/listings/core/services'
import { runListingsSearch } from '@/lib/features/listings/search/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'

/**
 * Public search with validated query params.
 */
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const queryResult = listingsSearchQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { data, pagination, error } = await runListingsSearch(queryResult.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to search listings' }, { status: 500 })
		}

		return NextResponse.json(
			{ ok: true, data: data ?? [], pagination },
			{ status: 200 },
		)
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/listings' } })
		console.error('UNEXPECTED: GET /api/listings', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}

/**
 * Creates a draft listing for the authenticated seller.
 */
export async function POST(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, createListingSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await createDraftListing(auth.user.id, validation.data)
		if (error instanceof ListingServiceError) {
			if (error.code === 'DETAILS_INVALID') {
				return NextResponse.json(
					{ ok: false, error: 'Invalid details', fields: error.fields },
					{ status: 400 },
				)
			}
			if (error.code === 'CATEGORY_MISMATCH') {
				return NextResponse.json(
					{ ok: false, error: 'Category platform mismatch' },
					{ status: 400 },
				)
			}
			if (error.code === 'NOT_FOUND') {
				return NextResponse.json({ ok: false, error: 'Category not found' }, { status: 400 })
			}
		}
		if (error || !data) {
			return NextResponse.json({ ok: false, error: 'Failed to create listing' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 201 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/listings' } })
		console.error('UNEXPECTED: POST /api/listings', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
