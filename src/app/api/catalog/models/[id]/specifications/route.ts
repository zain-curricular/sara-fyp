// ============================================================================
// GET /api/catalog/models/[id]/specifications
// ============================================================================
//
// Public specification row for an active model (1:1).

import { NextResponse } from 'next/server'

import { getSpecificationByModelPublic } from '@/lib/features/product-catalog/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Returns the specification JSON for the model when the model is active.
 */
export async function GET(
	_request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const { data, error } = await getSpecificationByModelPublic(idParse.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load specifications' }, { status: 500 })
		}
		if (!data) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/catalog/models/[id]/specifications' } })
		console.error('UNEXPECTED: GET /api/catalog/models/[id]/specifications', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
