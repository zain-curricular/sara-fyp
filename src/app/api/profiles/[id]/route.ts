// ============================================================================
// GET /api/profiles/[id]
// ============================================================================
//
// Public read of a profile by UUID. Returns PublicProfile (no email/phone/ban).
// Invalid UUID shape yields 404 to avoid enumeration. Delegates to getProfile.
//
// Auth
// ----
// None — marketplace displays seller/buyer public cards.

import { NextResponse } from 'next/server'

import { getProfile } from '@/lib/features/profiles/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Handles GET /api/profiles/:id — public profile by user id.
 *
 * @param _request - Unused (no query params).
 * @param context - Next.js dynamic route params (async in App Router).
 */
export async function GET(
	_request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await context.params

		// Treat malformed ids as not found (no distinction from missing row)
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const { data, error } = await getProfile(idParse.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load profile' }, { status: 500 })
		}
		if (!data) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/profiles/[id]' } })
		console.error('UNEXPECTED: GET /api/profiles/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
