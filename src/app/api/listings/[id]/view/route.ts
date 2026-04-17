// ============================================================================
// POST /api/listings/[id]/view — record browse history (auth)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { recordListingView } from '@/lib/features/favorites/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Records a listing view for recommendations / recently viewed (upsert).
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

		const { error } = await recordListingView(auth.user.id, idParse.data)
		if (error === 'Not found') {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to record view' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: null }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/listings/[id]/view' } })
		console.error('UNEXPECTED: POST /api/listings/[id]/view', serializeError(error))
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
