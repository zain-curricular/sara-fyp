// ============================================================================
// PATCH /api/listings/[id]/images/reorder
// ============================================================================

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { reorderListingImagesSchema } from '@/lib/features/listings'
import { ImageServiceError, reorderListingImages } from '@/lib/features/listings/images/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'

/**
 * Sets image order (positions 0..n-1) for the listing owner.
 */
export async function PATCH(
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

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, reorderListingImagesSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { error } = await reorderListingImages(
			idParse.data,
			auth.user.id,
			validation.data.image_ids,
		)
		if (error instanceof ImageServiceError && error.code === 'NOT_FOUND') {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to reorder images' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: null }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'PATCH /api/listings/[id]/images/reorder' } })
		console.error('UNEXPECTED: PATCH /api/listings/[id]/images/reorder', {
			error: serializeError(error),
		})
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
