// ============================================================================
// PATCH /api/admin/listings/[id] — moderation (admin)
// ============================================================================

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

import { adminModerateListingSchema } from '@/lib/features/listings'
import { adminModerateListing } from '@/lib/features/listings/core/services'
import { authenticateAndAuthorizeAdminListing } from '@/lib/features/listings/shared/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'

/**
 * Updates listing status for moderation (flag / restore / remove).
 */
export async function PATCH(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const auth = await authenticateAndAuthorizeAdminListing(request, idParse.data)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, adminModerateListingSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await adminModerateListing(auth.listing.id, validation.data.status)
		if (error || !data) {
			return NextResponse.json({ ok: false, error: 'Failed to update listing' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'PATCH /api/admin/listings/[id]' } })
		console.error('UNEXPECTED: PATCH /api/admin/listings/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
