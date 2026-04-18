// ============================================================================
// Notifications — map domain errors to HTTP (routes stay thin)
// ============================================================================

export function notificationsMutationErrorToHttp(error: unknown): {
	status: number
	body: { ok: false; error: string }
} {
	const msg = error instanceof Error ? error.message : String(error)
	if (msg === 'NOT_FOUND') {
		return { status: 404, body: { ok: false, error: 'Not found' } }
	}
	return { status: 500, body: { ok: false, error: 'Failed to update notification' } }
}
