// ============================================================================
// GET /api/catalog/categories
// ============================================================================
//
// Public list of active categories for a platform. Query: ?platform=mobile|automotive

import { NextResponse } from 'next/server'

import { catalogPlatformQuerySchema } from '@/lib/features/product-catalog'
import { listCategoriesPublic } from '@/lib/features/product-catalog/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Lists active categories for the given platform.
 */
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const queryResult = catalogPlatformQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { data, error } = await listCategoriesPublic(queryResult.data.platform)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load categories' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/catalog/categories' } })
		console.error('UNEXPECTED: GET /api/catalog/categories', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
