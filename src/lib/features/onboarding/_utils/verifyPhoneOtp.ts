// ============================================================================
// Onboarding — verify OTP and set phone_verified on profile
// ============================================================================

import { updateProfile } from '@/lib/features/profiles/services'
import type { Profile } from '@/lib/features/profiles/types'

import { otpStore } from '@/lib/features/onboarding/_utils/otpStore'

/**
 * Validates OTP from the in-memory store and marks the profile phone as verified.
 */
export async function verifyPhoneOtp(
	userId: string,
	phone_number: string,
	code: string,
): Promise<{ data: Profile | null; error: unknown }> {
	const entry = otpStore.get(userId)
	if (!entry || entry.expiresAt < Date.now()) {
		return { data: null, error: 'OTP_EXPIRED' }
	}
	if (entry.phone_number !== phone_number) {
		return { data: null, error: 'PHONE_MISMATCH' }
	}
	if (entry.code !== code.trim()) {
		return { data: null, error: 'INVALID_CODE' }
	}

	otpStore.delete(userId)

	return updateProfile(userId, {
		phone_number,
		phone_verified: true,
	})
}
