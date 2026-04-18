// ============================================================================
// POST /api/webhooks/order-payment — gateway callback (order escrow hold)
// ============================================================================

import { NextResponse } from 'next/server'

import { orderPaymentWebhookBodySchema } from '@/lib/features/orders'
import {
	applyOrderPaymentWebhook,
	orderPaymentWebhookErrorToHttp,
	verifyOrderPaymentWebhookSecret,
} from '@/lib/features/orders/services'
import { getClientIpFromRequest } from '@/lib/utils/clientIp'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { checkPaymentWebhookRateLimit, isRateLimited } from '@/lib/utils/rateLimit'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request) {
	try {
		const rate = await checkPaymentWebhookRateLimit(getClientIpFromRequest(request))
		if (isRateLimited(rate)) {
			return rate.error
		}

		const authErr = verifyOrderPaymentWebhookSecret(request)
		if (authErr) {
			return authErr
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, orderPaymentWebhookBodySchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { escrow_transaction_id, external_tx_id, status } = validation.data

		const { error } = await applyOrderPaymentWebhook({
			escrow_transaction_id,
			external_tx_id: external_tx_id ?? null,
			status,
		})

		if (error) {
			const { status: httpStatus, body } = orderPaymentWebhookErrorToHttp(error)
			return NextResponse.json(body, { status: httpStatus })
		}

		return NextResponse.json({ ok: true, data: { processed: true } }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/webhooks/order-payment' } })
		console.error('UNEXPECTED: POST /api/webhooks/order-payment', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
