// ============================================================================
// GET /api/admin/analytics/overview — MV-backed aggregates (admin)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateAndAuthorizeAdmin } from '@/lib/auth/adminRole'
import {
	adminAnalyticsWindowQuerySchema,
	getAdminOverview,
} from '@/lib/features/admin-panel/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request) {
	try {
		const auth = await authenticateAndAuthorizeAdmin(request)
		if (auth.error) {
			return auth.error
		}

		const { searchParams } = new URL(request.url)
		const parsed = adminAnalyticsWindowQuerySchema.safeParse(Object.fromEntries(searchParams))
		if (!parsed.success) {
			return NextResponse.json({ ok: false, error: 'Invalid query parameters' }, { status: 400 })
		}

		const { data, error } = await getAdminOverview(parsed.data)
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load analytics' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/admin/analytics/overview' } })
		console.error('UNEXPECTED: GET /api/admin/analytics/overview', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
