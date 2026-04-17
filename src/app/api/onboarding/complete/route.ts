// ============================================================================
// POST /api/onboarding/complete
// ============================================================================
//
// Authenticated: one-shot profile completion for the onboarding wizard.

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { completeOnboardingSchema } from '@/lib/features/onboarding'
import { completeOnboarding } from '@/lib/features/onboarding/services'
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
		const validation = validateRequestBody(body, completeOnboardingSchema)
		if (isValidationError(validation)) {
			return validation.error
		}

		const { data, error } = await completeOnboarding(auth.user.id, validation.data)
		if (error) {
			const msg = error instanceof Error ? error.message : String(error)
			if (msg === 'NOT_FOUND') {
				return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
			}
			if (msg === 'HANDLE_TAKEN') {
				return NextResponse.json({ ok: false, error: 'Handle is not available' }, { status: 409 })
			}
			if (msg === 'HANDLE_ALREADY_SET') {
				return NextResponse.json({ ok: false, error: 'Handle cannot be changed' }, { status: 409 })
			}
			if (msg === 'VERIFIED_PHONE_MISMATCH') {
				return NextResponse.json(
					{ ok: false, error: 'Phone number does not match your verified number' },
					{ status: 409 },
				)
			}
			return NextResponse.json({ ok: false, error: 'Failed to complete onboarding' }, { status: 500 })
		}

		return NextResponse.json({ ok: true, data }, { status: 200 })
	} catch (error) {
		Sentry.captureException(error, { extra: { route: 'POST /api/onboarding/complete' } })
		console.error('UNEXPECTED: POST /api/onboarding/complete', { error: serializeError(error) })
		return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
	}
}
