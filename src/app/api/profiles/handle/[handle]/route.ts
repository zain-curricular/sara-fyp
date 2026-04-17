// ============================================================================
// GET /api/profiles/handle/[handle]
// ============================================================================
//
// Public read by slug; accepts optional @ prefix for shareable URLs. Delegates
// to getPublicProfileByHandle.

import { NextResponse } from 'next/server'

import { getPublicProfileByHandle } from '@/lib/features/profiles/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Handles GET /api/profiles/handle/:handle — public profile by handle.
 *
 * @param _request - Unused.
 * @param context - Dynamic `{ handle }` segment from the path.
 */
export async function GET(
	_request: Request,
	context: { params: Promise<{ handle: string }> },
) {
	try {
		const { handle } = await context.params

		// Normalize @username-style paths to stored handle
		const normalized = handle.startsWith('@') ? handle.slice(1) : handle

		const { data, error } = await getPublicProfileByHandle(normalized)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load profile' }, { status: 500 })
		}
		if (!data) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/profiles/handle/[handle]' } })
		console.error('UNEXPECTED: GET /api/profiles/handle/[handle]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
