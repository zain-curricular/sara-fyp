// ============================================================================
// Shared Error Utilities
// ============================================================================

/** Safely serialize an unknown error for logging. */
export function serializeError(err: unknown): string {
	if (err instanceof Error) return err.message;
	if (typeof err === "string") return err;
	try {
		return JSON.stringify(err);
	} catch {
		return String(err);
	}
}
