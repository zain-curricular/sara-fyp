// ============================================================================
// GET/PATCH /api/profiles/me
// ============================================================================
//
// Authenticated self-service: full profile read and validated partial update.
// PATCH uses updateOwnProfileSchema (strict — no admin field smuggling).
//
// Auth
// ----
// Bearer JWT required for both methods.

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { getOwnProfile, updateOwnProfile } from '@/lib/features/profiles/services'
import { updateOwnProfileSchema } from '@/lib/features/profiles'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Returns the signed-in user’s full profile row.
 *
 * @param request - Must include `Authorization: Bearer <jwt>`.
 */
export async function GET(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const { data, error } = await getOwnProfile(auth.user.id)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load profile' }, { status: 500 })
		}
		if (!data) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/profiles/me' } })
		console.error('UNEXPECTED: GET /api/profiles/me', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}

/**
 * Updates the signed-in user’s profile (non-admin fields only).
 *
 * @param request - JSON body validated by updateOwnProfileSchema.
 */
export async function PATCH(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, updateOwnProfileSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await updateOwnProfile(auth.user.id, validation.data)
		if (error) {
			const msg = error instanceof Error ? error.message : ''
			if (msg === 'HANDLE_TAKEN') {
				return NextResponse.json({ ok: false, error: 'Handle is not available' }, { status: 409 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to update profile' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'PATCH /api/profiles/me' } })
		console.error('UNEXPECTED: PATCH /api/profiles/me', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
