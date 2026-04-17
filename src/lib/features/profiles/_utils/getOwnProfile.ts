// ============================================================================
// Profiles — authenticated self read
// ============================================================================
//
// Returns the full profile row for the signed-in user (GET /api/profiles/me).
// Caller must already have run authenticateFromRequest.

import { getProfileById } from '../_data-access/profilesDafs'
import type { Profile } from '@/lib/features/profiles/types'

/**
 * Loads the full profile for the given user id (typically auth.user.id).
 *
 * @param userId - Authenticated user id.
 */
export async function getOwnProfile(
	userId: string,
): Promise<{ data: Profile | null; error: unknown }> {
	return getProfileById(userId)
}
