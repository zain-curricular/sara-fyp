// ============================================================================
// POST /api/profiles/me/avatar
// ============================================================================
//
// Multipart upload: field name `file`. Validates size/MIME then delegates to
// uploadAvatar (Storage + profiles.avatar_url).
//
// Auth
// ----
// Bearer JWT required.

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { uploadAvatar } from '@/lib/features/profiles/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Accepts multipart/form-data with a single image file and updates avatar_url.
 *
 * @param request - FormData with `file` entry.
 */
export async function POST(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const form = await request.formData().catch(() => null)
		if (!form) {
			return NextResponse.json({ ok: false, error: 'Invalid form data' }, { status: 400 })
		}

		const file = form.get('file')
		if (!file || !(file instanceof File)) {
			return NextResponse.json({ ok: false, error: 'Missing file' }, { status: 400 })
		}

		const { data, error } = await uploadAvatar(auth.user.id, file)
		if (error) {
			const msg = error instanceof Error ? error.message : ''
			if (msg === 'FILE_TOO_LARGE') {
				return NextResponse.json({ ok: false, error: 'File too large' }, { status: 400 })
			}
			if (msg === 'INVALID_MIME') {
				return NextResponse.json({ ok: false, error: 'Invalid file type' }, { status: 400 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to upload avatar' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/profiles/me/avatar' } })
		console.error('UNEXPECTED: POST /api/profiles/me/avatar', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
