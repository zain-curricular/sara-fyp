// ============================================================================
// Profiles — read services (public shape)
// ============================================================================
//
// Strips email, phone_number, and is_banned from DAF rows for marketplace-facing
// responses. Own-profile and admin flows use other helpers for full rows.

import { getProfileByHandle, getProfileById } from '../_data-access/profilesDafs'
import type { PublicProfile } from '@/lib/features/profiles/types'

/**
 * Returns a public profile by user id, or null if missing / error.
 *
 * @param id - User/profile UUID.
 */
export async function getProfile(
	id: string,
): Promise<{ data: PublicProfile | null; error: unknown }> {
	const { data, error } = await getProfileById(id)
	if (error || !data) {
		return { data: null, error }
	}

	// Remove fields that must not appear in public API JSON
	const { email: _e, phone_number: _p, is_banned: _b, ...pub } = data
	return { data: pub, error: null }
}

/**
 * Returns a public profile by handle (optional leading @ stripped by route).
 *
 * @param handle - Canonical handle string.
 */
export async function getPublicProfileByHandle(
	handle: string,
): Promise<{ data: PublicProfile | null; error: unknown }> {
	const { data, error } = await getProfileByHandle(handle)
	if (error || !data) {
		return { data: null, error }
	}

	const { email: _e, phone_number: _p, is_banned: _b, ...pub } = data
	return { data: pub, error: null }
}
