// ============================================================================
// POST /api/favorites — toggle wishlist (auth)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { toggleFavoriteBodySchema } from '@/lib/features/favorites'
import { toggleFavorite } from '@/lib/features/favorites/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Toggles favorite for the given listing (body: { listing_id }).
 */
export async function POST(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, toggleFavoriteBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await toggleFavorite(auth.user.id, validation.data.listing_id)
		if (error === 'Not found') {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}
		if (error || !data) {
			return NextResponse.json({ ok: false, error: 'Failed to update favorites' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/favorites' } })
		console.error('UNEXPECTED: POST /api/favorites', serializeError(error))
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
