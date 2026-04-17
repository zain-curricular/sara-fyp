// ============================================================================
// GET, POST /api/admin/catalog/specifications
// ============================================================================
//
// GET requires query ?model_id=uuid. POST creates a specification row.

import { NextResponse } from 'next/server'

import {
	authenticateAndAuthorizeAdminCatalog,
	getSpecificationByModelId,
	createSpecification,
} from '@/lib/features/product-catalog/services'
import { adminSpecificationByModelQuerySchema, createSpecificationSchema } from '@/lib/features/product-catalog'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Loads the specification row for a model (1:1).
 */
export async function GET(request: Request) {
	try {
		const auth = await authenticateAndAuthorizeAdminCatalog(request)
		if (auth.error) {
			return auth.error
		}

		const { searchParams } = new URL(request.url)
		const queryResult = adminSpecificationByModelQuerySchema.safeParse(
			Object.fromEntries(searchParams),
		)
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { data, error } = await getSpecificationByModelId(queryResult.data.model_id)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load specification' }, { status: 500 })
		}
		if (!data) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/admin/catalog/specifications' } })
		console.error('UNEXPECTED: GET /api/admin/catalog/specifications', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}

/**
 * Creates a specification row.
 */
export async function POST(request: Request) {
	try {
		const auth = await authenticateAndAuthorizeAdminCatalog(request)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, createSpecificationSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await createSpecification(validation.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to create specification' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 201 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/admin/catalog/specifications' } })
		console.error('UNEXPECTED: POST /api/admin/catalog/specifications', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
