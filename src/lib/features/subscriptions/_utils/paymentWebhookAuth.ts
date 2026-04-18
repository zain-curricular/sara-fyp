// ============================================================================
// Payment webhook — shared secret (timing-safe compare)
// ============================================================================

import { timingSafeEqual } from 'crypto'

import { NextResponse } from 'next/server'

/**
 * Validates `Authorization: Bearer <secret>` or `X-Payment-Webhook-Secret`.
 * Returns a ready-to-return response when verification fails or secret is unset.
 */
export function verifyPaymentWebhookSecret(request: Request): NextResponse | null {
	const secret = process.env.PAYMENT_WEBHOOK_SECRET
	if (!secret || secret.length === 0) {
		return NextResponse.json({ ok: false, error: 'Webhook not configured' }, { status: 503 })
	}

	const auth = request.headers.get('authorization')
	const bearer = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : null
	const headerSecret = request.headers.get('x-payment-webhook-secret')?.trim()
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

export function getWebhookClientIdentifier(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for')
	if (forwarded) {
		return forwarded.split(',')[0].trim()
	}
	return request.headers.get('x-real-ip') ?? 'unknown'
}
