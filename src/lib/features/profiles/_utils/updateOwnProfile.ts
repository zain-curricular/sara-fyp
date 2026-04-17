// ============================================================================
// Profiles — self-service update orchestration
// ============================================================================
//
// Handles handle-claim (conditional update) separately from other fields.
// Returns HANDLE_TAKEN when claim row count is zero (race or taken).

import { claimHandleForProfile, updateProfile } from '../_data-access/profilesDafs'
import type { Profile } from '@/lib/features/profiles/types'
import type { UpdateOwnProfileInput } from '@/lib/features/profiles/schemas'

/**
 * Updates the caller’s profile: optional handle claim, then remaining fields.
 *
 * @param userId - Authenticated user id.
 * @param patch - Validated body from updateOwnProfileSchema.
 */
export async function updateOwnProfile(
	userId: string,
	patch: UpdateOwnProfileInput,
): Promise<{ data: Profile | null; error: unknown }> {
	if (patch.handle) {
		const { data: claimed, error: claimErr } = await claimHandleForProfile(userId, patch.handle)
		if (claimErr) {
			return { data: null, error: claimErr }
		}
		if (!claimed) {
			return { data: null, error: new Error('HANDLE_TAKEN') }
		}

		const { handle: _h, ...rest } = patch

		// Handle-only update: claim already persisted the row
		if (Object.keys(rest).length === 0) {
			return { data: claimed, error: null }
		}

		return updateProfile(userId, rest)
	}

	const { handle: _h, ...rest } = patch
	return updateProfile(userId, rest)
}
