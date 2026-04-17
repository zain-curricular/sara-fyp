// ============================================================================
// Postgres unique constraint (23505) detection
// ============================================================================
//
// PostgREST surfaces SQLSTATE 23505 on unique violations. Used to map handle
// collisions to application-level HANDLE_TAKEN responses.

import type { PostgrestError } from '@supabase/supabase-js'

/**
 * True when the error is a Postgres unique_violation (e.g. duplicate handle).
 */
export function isPostgresUniqueViolation(error: unknown): boolean {
	if (!error || typeof error !== 'object') {
		return false
	}
	const e = error as PostgrestError
	return e.code === '23505'
}
