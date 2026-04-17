// ============================================================================
// DELETE /api/listings/[id]/images/[imageId]
// ============================================================================

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

import { authenticateFromRequest } from '@/lib/auth/auth'
import {
	deleteListingImageForOwner,
	ImageServiceError,
} from '@/lib/features/listings/images/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'

/**
 * Deletes one image (storage + row) for the listing owner.
 */
export async function DELETE(
	request: Request,
	context: { params: Promise<{ id: string; imageId: string }> },
) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const { id, imageId } = await context.params
		const idParse = uuidValidation.safeParse(id)
		const imgParse = uuidValidation.safeParse(imageId)
		if (!idParse.success || !imgParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const { error } = await deleteListingImageForOwner(imgParse.data, idParse.data, auth.user.id)
		if (error instanceof ImageServiceError && error.code === 'NOT_FOUND') {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to delete image' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: null }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'DELETE /api/listings/[id]/images/[imageId]' } })
		console.error('UNEXPECTED: DELETE /api/listings/[id]/images/[imageId]', {
			error: serializeError(error),
		})
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
