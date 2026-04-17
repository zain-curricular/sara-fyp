// ============================================================================
// GET, PATCH, DELETE /api/admin/catalog/brands/[id]
// ============================================================================

import { NextResponse } from 'next/server'

import {
	authenticateAndAuthorizeAdminCatalog,
	getBrandById,
	updateBrandById,
	deleteBrandById,
} from '@/lib/features/product-catalog/services'
import { updateBrandSchema } from '@/lib/features/product-catalog'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Loads one brand by id.
 */
export async function GET(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await authenticateAndAuthorizeAdminCatalog(request)
		if (auth.error) {
			return auth.error
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const { data, error } = await getBrandById(idParse.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load brand' }, { status: 500 })
		}
		if (!data) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/admin/catalog/brands/[id]' } })
		console.error('UNEXPECTED: GET /api/admin/catalog/brands/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}

/**
 * Updates a brand.
 */
export async function PATCH(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await authenticateAndAuthorizeAdminCatalog(request)
		if (auth.error) {
			return auth.error
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, updateBrandSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await updateBrandById(
			idParse.data,
			validation.data as Record<string, unknown>,
		)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to update brand' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'PATCH /api/admin/catalog/brands/[id]' } })
		console.error('UNEXPECTED: PATCH /api/admin/catalog/brands/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}

/**
 * Deletes a brand.
 */
export async function DELETE(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await authenticateAndAuthorizeAdminCatalog(request)
		if (auth.error) {
			return auth.error
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const { error } = await deleteBrandById(idParse.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to delete brand' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: null }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'DELETE /api/admin/catalog/brands/[id]' } })
		console.error('UNEXPECTED: DELETE /api/admin/catalog/brands/[id]', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
