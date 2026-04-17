// ============================================================================
// PATCH /api/admin/profiles/[id]
// ============================================================================
//
// Admin-only profile moderation (role, verified, banned, plus user fields).
// Uses authenticateAndAuthorizeAdminProfile then adminUpdateProfile.
//
// Auth
// ----
// Bearer JWT + caller profiles.role === 'admin'.

import { NextResponse } from 'next/server'

import { authenticateAndAuthorizeAdminProfile, adminUpdateProfile } from '@/lib/features/profiles/services'
import { adminUpdateProfileSchema } from '@/lib/features/profiles'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Updates another user’s profile — admin schema (moderation fields allowed).
 *
 * @param request - JSON body validated by adminUpdateProfileSchema.
 * @param context - Dynamic `{ id }` = target profile id.
 */
export async function PATCH(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await context.params

		const auth = await authenticateAndAuthorizeAdminProfile(request, id)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, adminUpdateProfileSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await adminUpdateProfile(auth.targetProfile.id, validation.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to update profile' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'PATCH /api/admin/profiles/[id]' } })
		console.error('UNEXPECTED: PATCH /api/admin/profiles/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
