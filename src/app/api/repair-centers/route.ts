// ============================================================================
// GET /api/repair-centers — active repair centers (public)
// ============================================================================

import { NextResponse } from 'next/server'

import { listActiveRepairCenters } from '@/lib/features/warranty/services'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function GET() {
	try {
		const { data, error } = await listActiveRepairCenters()
		if (error) {
			return NextResponse.json({ ok: false, error: 'Failed to load repair centers' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'GET /api/repair-centers' } })
		console.error('UNEXPECTED: GET /api/repair-centers', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
