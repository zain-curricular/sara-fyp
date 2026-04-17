// ============================================================================
// POST /api/listings/[id]/images — multipart upload (auth + owner)
// ============================================================================

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { addListingImageFromUpload, ImageServiceError } from '@/lib/features/listings/images/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'

/**
 * Accepts `multipart/form-data` with field `file` (jpeg/png/webp).
 */
export async function POST(
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

		const form = await request.formData()
		const file = form.get('file')
		if (!file || typeof file === 'string') {
			return NextResponse.json({ ok: false, error: 'Missing file' }, { status: 400 })
		}

		const buf = new Uint8Array(await file.arrayBuffer())
		const { data, error } = await addListingImageFromUpload({
			userId: auth.user.id,
			listingId: idParse.data,
			fileBytes: buf,
			contentType: file.type,
		})

		if (error instanceof ImageServiceError) {
			if (error.code === 'NOT_FOUND') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
			if (error.code === 'FILE_TOO_LARGE') {
				return NextResponse.json({ ok: false, error: 'File too large' }, { status: 400 })
			}
			if (error.code === 'INVALID_MIME') {
				return NextResponse.json({ ok: false, error: 'Invalid file type' }, { status: 400 })
			}
			if (error.code === 'IMAGE_LIMIT_REACHED') {
				return NextResponse.json({ ok: false, error: 'Maximum images reached' }, { status: 400 })
			}
		}
		if (error || !data) {
			return NextResponse.json({ ok: false, error: 'Failed to upload image' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 201 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/listings/[id]/images' } })
		console.error('UNEXPECTED: POST /api/listings/[id]/images', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
