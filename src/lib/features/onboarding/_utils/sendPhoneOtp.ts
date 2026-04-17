// ============================================================================
// Onboarding — generate OTP and send via provider
// ============================================================================

import { getOtpProvider } from '@/lib/features/onboarding/_providers/otpProvider'
import { tryRecordOtpSend } from '@/lib/features/onboarding/_utils/otpSendRateLimit'
import { createOtpEntry, otpStore } from '@/lib/features/onboarding/_utils/otpStore'

function randomSixDigitCode(): string {
	return String(Math.floor(100000 + Math.random() * 900000))
}

/**
 * Stores an OTP for the user and invokes the configured provider (console in dev).
 */
export async function sendPhoneOtp(
	userId: string,
	phone_number: string,
): Promise<{ error: unknown }> {
	if (!tryRecordOtpSend(userId)) {
		return { error: 'RATE_LIMITED' }
	}

	const code = randomSixDigitCode()
	otpStore.set(userId, createOtpEntry(code, phone_number))

	const { ok, error } = await getOtpProvider().send({ phone_number, code })
	if (!ok) {
		otpStore.delete(userId)
		return { error: error ?? 'Failed to send OTP' }
	}

	return { error: null }
}
