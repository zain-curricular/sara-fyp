// ============================================================================
// GET /api/admin/warranty-claims — list claims (admin)
// ============================================================================

import { NextResponse } from 'next/server'

import {
	authenticateAndAuthorizeAdmin,
	listClaimsForAdmin,
	listWarrantyClaimsAdminQuerySchema,
} from '@/lib/features/warranty/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request) {
	try {
		const auth = await authenticateAndAuthorizeAdmin(request)
		if (auth.error) {
			return auth.error
		}

		const { searchParams } = new URL(request.url)
		const queryResult = listWarrantyClaimsAdminQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!queryResult.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query' }, { status: 400 })
		}

		const { limit, offset, status } = queryResult.data
		const { data, error, pagination } = await listClaimsForAdmin({
			limit,
			offset,
			status,
		})

		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load claims' }, { status: 500 })
		}

		return NextResponse.json(
			{
				ok: true,
				data: data ?? [],
				pagination: pagination ?? {
					total: 0,
					limit,
					offset,
					hasMore: false,
				},
			},
			{ status: 200 },
		)
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/admin/warranty-claims' } })
		console.error('UNEXPECTED: GET /api/admin/warranty-claims', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
