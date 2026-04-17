// ============================================================================
// GET /api/catalog/models
// ============================================================================
//
// Public model search (active models only). Query: q (required), optional
// platform, brand_id.

import { NextResponse } from 'next/server'

import { catalogModelsSearchQuerySchema } from '@/lib/features/product-catalog'
import { searchModelsPublic } from '@/lib/features/product-catalog/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

/**
 * Searches models by name substring.
 */
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const raw = Object.fromEntries(searchParams)
		const queryResult = catalogModelsSearchQuerySchema.safeParse({
			q: raw.q ?? '',
			platform: raw.platform || undefined,
			brand_id: raw.brand_id || undefined,
		})
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { platform, brand_id: brandId, q } = queryResult.data
		const { data, error } = await searchModelsPublic(q, {
			platform,
			brandId,
		})
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to search models' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/catalog/models' } })
		console.error('UNEXPECTED: GET /api/catalog/models', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
