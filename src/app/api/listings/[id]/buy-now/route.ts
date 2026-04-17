// ============================================================================
// POST /api/listings/[id]/buy-now — fixed-price purchase (RPC)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { buyNowListing } from '@/lib/features/listings/commerce/services'
import { uuidValidation } from '@/lib/validation'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

function bearerToken(request: Request): string | null {
	const header = request.headers.get('authorization')
	if (!header?.startsWith('Bearer ')) {
		return null
	}
	return header.slice(7).trim()
}

/**
 * Runs `create_buy_now_order` as the authenticated buyer.
 */
export async function POST(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const token = bearerToken(request)
		if (!token) {
			return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await context.params
		const idParse = uuidValidation.safeParse(id)
		if (!idParse.success) {
			return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
		}

		const result = await buyNowListing(token, idParse.data)
		if (!result.ok) {
			const errLower = result.error.toLowerCase()
			const status = errLower.includes('not found') ? 404 : 400
			return NextResponse.json({ ok: false, error: result.error }, { status })
		}

		return NextResponse.json({ ok: true, data: { order_id: result.orderId } }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/listings/[id]/buy-now' } })
		console.error('UNEXPECTED: POST /api/listings/[id]/buy-now', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
