// ============================================================================
// Error serialization for logs
// ============================================================================
//
// Converts unknown thrown values into plain objects safe to log next to
// UNEXPECTED route messages without leaking stack traces to clients.

/**
 * Normalizes an unknown value to a small JSON-serializable object for logging.
 *
 * @param error - Caught value from catch (Error or non-Error).
 * @returns Object with `message` and optional `name` for Error instances.
 */
export function serializeError(error: unknown): { message: string; name?: string } {
	if (error instanceof Error) {
		return { message: error.message, name: error.name }
	}
	return { message: String(error) }
}
