// ============================================================================
// GET /api/warranties/[id] — single warranty (buyer, seller, or admin)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import {
	getWarrantyForParticipant,
	warrantyClaimMutationErrorToHttp,
} from '@/lib/features/warranty/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
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

		const { data, error } = await getWarrantyForParticipant(auth.user.id, idParse.data)
		if (error) {
			const { status, body } = warrantyClaimMutationErrorToHttp(error)
			return NextResponse.json(body, { status })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/warranties/[id]' } })
		console.error('UNEXPECTED: GET /api/warranties/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
