// ============================================================================
// POST /api/warranty-claims/[id]/photos — claimant uploads evidence (max 5)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import {
	addPhotoToWarrantyClaim,
	warrantyPhotoErrorToHttp,
} from '@/lib/features/warranty/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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

		const form = await request.formData().catch(() => null)
		if (!form) {
			return NextResponse.json({ ok: false, error: 'Invalid form data' }, { status: 400 })
		}

		const file = form.get('file')
		if (!(file instanceof File)) {
			return NextResponse.json({ ok: false, error: 'file is required' }, { status: 400 })
		}

		const buf = new Uint8Array(await file.arrayBuffer())
		const { data, error } = await addPhotoToWarrantyClaim({
			claimId: idParse.data,
			userId: auth.user.id,
			bytes: buf,
			contentType: file.type || 'application/octet-stream',
		})

		if (error) {
			const { status, body } = warrantyPhotoErrorToHttp(error)
			return NextResponse.json(body, { status })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/warranty-claims/[id]/photos' } })
		console.error('UNEXPECTED: POST /api/warranty-claims/[id]/photos', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
