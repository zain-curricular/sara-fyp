// ============================================================================
// POST /api/onboarding/phone/send-otp
// ============================================================================
//
// Authenticated: stores a 6-digit OTP for the signed-in user and logs it (dev).

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { sendPhoneOtpSchema } from '@/lib/features/onboarding'
import { sendPhoneOtp } from '@/lib/features/onboarding/services'
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
		const validation = validateRequestBody(body, sendPhoneOtpSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { error } = await sendPhoneOtp(auth.user.id, validation.data.phone_number)
		if (error) {
			if (error === 'RATE_LIMITED') {
				return NextResponse.json(
					{ ok: false, error: 'Too many verification attempts. Try again later.' },
					{ status: 429 },
				)
			}
			return NextResponse.json({ ok: false, error: 'Failed to send verification code' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data: { sent: true } }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/onboarding/phone/send-otp' } })
		console.error('UNEXPECTED: POST /api/onboarding/phone/send-otp', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
