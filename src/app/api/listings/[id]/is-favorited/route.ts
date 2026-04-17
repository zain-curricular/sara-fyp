// ============================================================================
// GET /api/listings/[id]/is-favorited — wishlist flag (auth)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { isListingFavorited } from '@/lib/features/favorites/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Returns whether the current user has favorited this listing.
 */
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

		const { data, error } = await isListingFavorited(auth.user.id, idParse.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to check favorites' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: { is_favorited: data } }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/listings/[id]/is-favorited' } })
		console.error('UNEXPECTED: GET /api/listings/[id]/is-favorited', serializeError(error))
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
