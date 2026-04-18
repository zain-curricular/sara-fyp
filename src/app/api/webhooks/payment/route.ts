// ============================================================================
// POST /api/webhooks/payment
// ============================================================================
//
// Payment gateway callback (subscription + future order payments). Requires
// PAYMENT_WEBHOOK_SECRET via Authorization: Bearer or X-Payment-Webhook-Secret.

import { NextResponse } from 'next/server'

import { paymentWebhookBodySchema } from '@/lib/features/subscriptions'
import {
	activateSubscriptionFromEscrowCompletion,
	getWebhookClientIdentifier,
	markSubscriptionEscrowFailed,
	verifyPaymentWebhookSecret,
} from '@/lib/features/subscriptions/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { checkPaymentWebhookRateLimit, isRateLimited } from '@/lib/utils/rateLimit'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request) {
	try {
		const rate = await checkPaymentWebhookRateLimit(getWebhookClientIdentifier(request))
		if (isRateLimited(rate)) {
			return rate.error
		}

		const authErr = verifyPaymentWebhookSecret(request)
		if (authErr) {
			return authErr
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, paymentWebhookBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { escrow_transaction_id, external_tx_id, status } = validation.data

		if (status === 'failed') {
			const { error } = await markSubscriptionEscrowFailed(escrow_transaction_id)
			if (error) {
				const msg = error instanceof Error ? error.message : String(error)
				if (msg === 'NOT_FOUND') {
					return NextResponse.json({ ok: false, error: 'Transaction not found' }, { status: 404 })
				}
				if (msg === 'NOT_SUBSCRIPTION_INTENT') {
					return NextResponse.json({ ok: false, error: 'Not a subscription payment' }, { status: 400 })
				}
				if (msg === 'INVALID_STATE') {
					return NextResponse.json({ ok: false, error: 'Invalid transaction state' }, { status: 409 })
				}
				return NextResponse.json({ ok: false, error: 'Failed to record failure' }, { status: 500 })
			}
			return NextResponse.json({ ok: true, data: { processed: true } }, { status: 200 })
		}

		const { data, error } = await activateSubscriptionFromEscrowCompletion(
			escrow_transaction_id,
			external_tx_id ?? null,
		)
		if (error) {
			const msg = error instanceof Error ? error.message : String(error)
			if (msg === 'NOT_FOUND') {
				return NextResponse.json({ ok: false, error: 'Transaction not found' }, { status: 404 })
			}
			if (msg === 'ALREADY_COMPLETED') {
				return NextResponse.json({ ok: false, error: 'Already processed' }, { status: 409 })
			}
			if (msg === 'NOT_SUBSCRIPTION_INTENT') {
				return NextResponse.json({ ok: false, error: 'Not a subscription payment' }, { status: 400 })
			}
			if (msg === 'UNKNOWN_TIER') {
				return NextResponse.json({ ok: false, error: 'Invalid tier' }, { status: 400 })
			}
			if (msg === 'INVALID_STATE') {
				return NextResponse.json({ ok: false, error: 'Invalid transaction state' }, { status: 409 })
			}
			return NextResponse.json({ ok: false, error: 'Activation failed' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/webhooks/payment' } })
		console.error('UNEXPECTED: POST /api/webhooks/payment', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
