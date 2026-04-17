// ============================================================================
// PostgREST “not found” detection
// ============================================================================
//
// Supabase/PostgREST returns error code PGRST116 when .single() expected one
// row and got zero. We treat that as “not found” and avoid logging it as a
// server error alongside real DB failures.

import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Returns true when the error is PostgREST’s empty-result code (PGRST116).
 *
 * @param error - Value from Supabase query `error` field.
 */
export function isNotFoundError(error: unknown): boolean {
	if (!error || typeof error !== 'object') {
		return false
	}
	const e = error as PostgrestError
	return e.code === 'PGRST116'
}
