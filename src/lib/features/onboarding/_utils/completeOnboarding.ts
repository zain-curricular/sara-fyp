// ============================================================================
// Onboarding — single-step profile completion
// ============================================================================

import type { CompleteOnboardingInput } from '@/lib/features/onboarding/schemas'
import {
	claimHandleForProfile,
	getProfileById,
	updateProfile,
} from '@/lib/features/profiles/services'
import type { Profile } from '@/lib/features/profiles/types'
import { isPostgresUniqueViolation } from '@/lib/utils/isPostgresUniqueViolation'

/**
 * Sets display, contact, optional handle claim, locale, and onboarding_completed_at.
 * Idempotent: safe to call again (re-stamps completion time).
 */
export async function completeOnboarding(
	userId: string,
	input: CompleteOnboardingInput,
): Promise<{ data: Profile | null; error: unknown }> {
	const { data: profile, error: gErr } = await getProfileById(userId)
	if (gErr) {
		return { data: null, error: gErr }
	}
	if (!profile) {
		console.error('onboarding:completeOnboarding profile not found', { userId })
		return { data: null, error: new Error('NOT_FOUND') }
	}

	if (
		input.phone_number !== undefined &&
		profile.phone_verified &&
		profile.phone_number !== input.phone_number
	) {
		return { data: null, error: new Error('VERIFIED_PHONE_MISMATCH') }
	}

	if (input.handle) {
		const normalized = input.handle.trim().toLowerCase()
		const existing = profile.handle?.toLowerCase() ?? null
		if (existing && existing !== normalized) {
			return { data: null, error: new Error('HANDLE_ALREADY_SET') }
		}
		if (!existing) {
			const { data: claimed, error: cErr } = await claimHandleForProfile(userId, normalized)
			if (cErr) {
				if (isPostgresUniqueViolation(cErr)) {
					return { data: null, error: new Error('HANDLE_TAKEN') }
				}
				return { data: null, error: cErr }
			}
			if (!claimed) {
				return { data: null, error: new Error('HANDLE_TAKEN') }
			}
		}
	}

	return updateProfile(userId, {
		display_name: input.display_name,
		...(input.phone_number !== undefined ? { phone_number: input.phone_number } : {}),
		city: input.city,
		locale: input.locale ?? 'en',
		onboarding_completed_at: new Date().toISOString(),
	})
}
