// ============================================================================
// Profiles — admin moderation update
// ============================================================================
//
// Thin delegate to DAF updateProfile after route-level admin auth wrapper.
// Authorization is enforced in authenticateAndAuthorizeAdminProfile, not here.

import { updateProfile } from '../_data-access/profilesDafs'
import type { Profile } from '@/lib/features/profiles/types'
import type { AdminUpdateProfileInput } from '@/lib/features/profiles/schemas'

/**
 * Applies an admin-validated patch to another user’s profile.
 *
 * @param targetId - Profile id from URL.
 * @param patch - Validated adminUpdateProfileSchema payload.
 */
export async function adminUpdateProfile(
	targetId: string,
	patch: AdminUpdateProfileInput,
): Promise<{ data: Profile | null; error: unknown }> {
	return updateProfile(targetId, patch)
}
