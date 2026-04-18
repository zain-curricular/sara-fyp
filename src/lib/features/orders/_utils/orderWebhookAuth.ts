// ============================================================================
// Order payment webhook — shared secret (timing-safe compare)
// ============================================================================
//
// Uses ORDER_PAYMENT_WEBHOOK_SECRET when set; otherwise PAYMENT_WEBHOOK_SECRET
// so local/dev can reuse the subscription payment secret.

import { timingSafeEqual } from 'crypto'

import { NextResponse } from 'next/server'

function resolveSecret(): string | null {
	const a = process.env.ORDER_PAYMENT_WEBHOOK_SECRET
	const b = process.env.PAYMENT_WEBHOOK_SECRET
	return (a && a.length > 0 ? a : b && b.length > 0 ? b : null) ?? null
}

/**
 * Validates `Authorization: Bearer <secret>` or `X-Order-Payment-Webhook-Secret`.
 */
export function verifyOrderPaymentWebhookSecret(request: Request): NextResponse | null {
	const secret = resolveSecret()
	if (!secret) {
		return NextResponse.json({ ok: false, error: 'Webhook not configured' }, { status: 503 })
	}

	const auth = request.headers.get('authorization')
	const bearer = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : null
	const headerSecret = request.headers.get('x-order-payment-webhook-secret')?.trim()
	const token = bearer ?? headerSecret

	if (!token) {
		return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
	}

	const a = Buffer.from(token, 'utf8')
	const b = Buffer.from(secret, 'utf8')
	if (a.length !== b.length || !timingSafeEqual(a, b)) {
		return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
	}

	return null
}
