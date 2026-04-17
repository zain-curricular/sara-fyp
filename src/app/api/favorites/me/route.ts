// ============================================================================
// GET /api/favorites/me — paginated wishlist (auth)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { favoritesListQuerySchema } from '@/lib/features/favorites'
import { listMyFavorites } from '@/lib/features/favorites/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Lists saved listings for the authenticated user.
 */
export async function GET(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const { searchParams } = new URL(request.url)
		const queryResult = favoritesListQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { page, limit } = queryResult.data
		const { data, error, pagination } = await listMyFavorites(auth.user.id, page, limit)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load favorites' }, { status: 500 })
		}

		return NextResponse.json(
			{ ok: true, data: data ?? [], pagination: pagination ?? { total: 0, limit, offset: 0, hasMore: false } },
			{ status: 200 },
		)
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/favorites/me' } })
		console.error('UNEXPECTED: GET /api/favorites/me', serializeError(error))
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
