// ============================================================================
// POST /api/onboarding/phone/verify-otp
// ============================================================================
//
// Authenticated: checks OTP from the in-memory store and sets phone_verified.

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { verifyPhoneOtpSchema } from '@/lib/features/onboarding'
import { verifyPhoneOtp } from '@/lib/features/onboarding/services'
import { isValidationError, validateRequestBody } from '@/lib/utils/validateRequestBody'
import { serializeError } from '@/lib/utils/serializeError'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request) {
	try {
		const auth = await authenticateFromRequest(request)
		if (auth.error) {
			return auth.error
		}

		const body = await request.json().catch(() => ({}))
		const validation = validateRequestBody(body, verifyPhoneOtpSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { phone_number, code } = validation.data
		const { data, error } = await verifyPhoneOtp(auth.user.id, phone_number, code)
		if (error) {
			const clientErrors: Record<string, string> = {
				OTP_EXPIRED: 'Verification code expired',
				PHONE_MISMATCH: 'Phone number does not match',
				INVALID_CODE: 'Invalid verification code',
			}
			const msg =
				typeof error === 'string' && error in clientErrors
					? clientErrors[error]
					: null
			if (msg) {
				return NextResponse.json({ ok: false, error: msg }, { status: 400 })
			}
			return NextResponse.json({ ok: false, error: 'Failed to verify phone' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/onboarding/phone/verify-otp' } })
		console.error('UNEXPECTED: POST /api/onboarding/phone/verify-otp', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
