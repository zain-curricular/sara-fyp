// ============================================================================
// POST /api/testing/reports/[id]/photos — upload inspection photo (multipart)
// ============================================================================

import { NextResponse } from 'next/server'

import {
	addPhotoErrorToHttp,
	addPhotoToReport,
	authenticateAndAuthorizeTester,
} from '@/lib/features/device-testing/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await authenticateAndAuthorizeTester(request)
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
		const criterionKey = form.get('criterion_key')
		if (!(file instanceof File) || typeof criterionKey !== 'string' || !criterionKey.trim()) {
			return NextResponse.json({ ok: false, error: 'file and criterion_key are required' }, { status: 400 })
		}

		const buf = new Uint8Array(await file.arrayBuffer())
		const { data, error } = await addPhotoToReport({
			reportId: idParse.data,
			testerId: auth.user.id,
			criterionKey: criterionKey.trim(),
			bytes: buf,
			contentType: file.type || 'application/octet-stream',
		})

		if (error) {
			const { status, body } = addPhotoErrorToHttp(error)
			return NextResponse.json(body, { status })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/testing/reports/[id]/photos' } })
		console.error('UNEXPECTED: POST /api/testing/reports/[id]/photos', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
