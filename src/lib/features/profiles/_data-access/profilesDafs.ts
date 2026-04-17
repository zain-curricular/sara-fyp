// ============================================================================
// Profiles — data access (typed admin client)
// ============================================================================
//
// All profile DAFs live here per feature-module conventions. The typed
// service-role client bypasses RLS; services enforce auth and shape public
// views. DAFs never throw — they return `{ data, error }`.
//
// Tables
// ------
// `public.profiles` — one row per auth user.

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import type { Database, ProfileRow } from '@/lib/supabase/database.types'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/**
 * Loads a profile by primary key.
 *
 * @param id - Profile UUID (same as auth.users.id).
 */
export async function getProfileById(
	id: string,
): Promise<{ data: ProfileRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('profiles')
		.select('*')
		.eq('id', id)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('profiles:getProfileById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

/**
 * Loads a profile by unique handle (public slug).
 *
 * @param handle - Stored handle string (no @ prefix).
 */
export async function getProfileByHandle(
	handle: string,
): Promise<{ data: ProfileRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('profiles')
		.select('*')
		.eq('handle', handle)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('profiles:getProfileByHandle', { handle }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

/**
 * Applies a partial update to a profile row. Caller must authorize.
 *
 * @param id - Target profile id.
 * @param patch - Typed update (already validated against user or admin schema).
 */
export async function updateProfile(
	id: string,
	patch: ProfileUpdate,
): Promise<{ data: ProfileRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('profiles')
		.update(patch)
		.eq('id', id)
		.select('*')
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('profiles:updateProfile', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

/**
 * Sets `handle` only when currently null (race-safe atomic claim).
 *
 * @param id - Profile id.
 * @param handle - Desired unique handle.
 */
export async function claimHandleForProfile(
	id: string,
	handle: string,
): Promise<{ data: ProfileRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('profiles')
		.update({ handle })
		.eq('id', id)
		.is('handle', null)
		.select('*')
		.maybeSingle()

	if (error) {
		logDatabaseError('profiles:claimHandleForProfile', { id, handle }, error)
	}
	return { data, error }
}
