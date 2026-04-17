// ============================================================================
// GET /api/catalog/categories/[id]/schema
// ============================================================================
//
// Returns spec_schema JSON for an active category (listing form field definitions).

import { NextResponse } from 'next/server'

import { getCategorySpecSchemaPublic } from '@/lib/features/product-catalog/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Returns the category spec_schema object for active categories only.
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

		const { data, error } = await getCategorySpecSchemaPublic(idParse.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load category schema' }, { status: 500 })
		}
		if (data === null) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/catalog/categories/[id]/schema' } })
		console.error('UNEXPECTED: GET /api/catalog/categories/[id]/schema', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
