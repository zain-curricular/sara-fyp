// ============================================================================
// Messaging — map service errors to HTTP
// ============================================================================

export function messagingMutationErrorToHttp(error: unknown): {
	status: number
	body: { ok: false; error: string }
} {
	if (error instanceof Error) {
		const msg = error.message
		if (msg === 'NOT_FOUND') {
			return { status: 404, body: { ok: false, error: 'Not found' } }
		}
		if (msg === 'FORBIDDEN') {
			return { status: 403, body: { ok: false, error: 'Forbidden' } }
		}
		if (msg === 'CANNOT_MESSAGE_OWN_LISTING') {
			return {
				status: 403,
				body: { ok: false, error: 'You cannot start a conversation on your own listing' },
			}
		}
		if (msg === 'LISTING_NOT_ACTIVE') {
			return {
				status: 409,
				body: { ok: false, error: 'Listing is not available for messaging' },
			}
		}
	}
	return { status: 500, body: { ok: false, error: 'Request failed' } }
}
