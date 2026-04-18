// ============================================================================
// GET /api/subscriptions/plans
// ============================================================================
//
// Public catalog of static seller tiers (marketing + checkout UI).

import { NextResponse } from 'next/server'

import { listPlans } from '@/lib/features/subscriptions/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET() {
	try {
		const plans = listPlans()
		return NextResponse.json({ ok: true, data: plans }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/subscriptions/plans' } })
		console.error('UNEXPECTED: GET /api/subscriptions/plans', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
