// ============================================================================
// GET, POST /api/admin/catalog/models
// ============================================================================

import { NextResponse } from 'next/server'

import {
	authenticateAndAuthorizeAdminCatalog,
	listModelsByPlatform,
	createModel,
} from '@/lib/features/product-catalog/services'
import { catalogPlatformQuerySchema, createModelSchema } from '@/lib/features/product-catalog'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Lists models for a platform (includes inactive).
 */
export async function GET(request: Request) {
	try {
		const auth = await authenticateAndAuthorizeAdminCatalog(request)
		if (auth.error) {
			return auth.error
		}

		const { searchParams } = new URL(request.url)
		const queryResult = catalogPlatformQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { data, error } = await listModelsByPlatform(queryResult.data.platform)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load models' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/admin/catalog/models' } })
		console.error('UNEXPECTED: GET /api/admin/catalog/models', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}

/**
 * Creates a model row.
 */
export async function POST(request: Request) {
	try {
		const auth = await authenticateAndAuthorizeAdminCatalog(request)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, createModelSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await createModel(validation.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to create model' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 201 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/admin/catalog/models' } })
		console.error('UNEXPECTED: POST /api/admin/catalog/models', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
