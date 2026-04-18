// ============================================================================
// GET /api/admin/analytics/moderation — KPIs (admin)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateAndAuthorizeAdmin } from '@/lib/auth/adminRole'
import { getAdminModerationKpis } from '@/lib/features/admin-panel/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET(_request: Request) {
	try {
		const auth = await authenticateAndAuthorizeAdmin(request)
		if (auth.error) {
			return auth.error
		}

		const { data, error } = await getAdminModerationKpis()
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load moderation KPIs' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/admin/analytics/moderation' } })
		console.error('UNEXPECTED: GET /api/admin/analytics/moderation', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
