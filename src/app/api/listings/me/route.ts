// ============================================================================
// GET /api/listings/me — seller’s listings (auth)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { listListingsByUserId } from '@/lib/features/listings/core/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Lists all non–soft-deleted listings for the authenticated user.
 */
export async function GET(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const { data, error } = await listListingsByUserId(auth.user.id)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load listings' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/listings/me' } })
		console.error('UNEXPECTED: GET /api/listings/me', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
