// ============================================================================
// Database error logging (DAF layer)
// ============================================================================
//
// Central place for structured console logging when Supabase returns an error
// that is not a benign “not found”. Pair with isNotFoundError in DAFs.

/**
 * Logs a database operation failure with context for debugging.
 *
 * @param operation - Short label (e.g. `profiles:getProfileById`).
 * @param context - Serializable args (ids, filters) — no PII beyond what’s needed.
 * @param error - Raw error from Supabase.
 */
export function logDatabaseError(
	operation: string,
	context: Record<string, unknown>,
	error: unknown,
): void {
	console.error(`[db] ${operation}`, context, error)
}
