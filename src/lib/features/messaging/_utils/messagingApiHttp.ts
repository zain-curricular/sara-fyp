// ============================================================================
// Messaging — map service errors to HTTP
// ============================================================================

function flattenErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message
	}
	if (error && typeof error === 'object' && 'message' in error) {
		return String((error as { message: unknown }).message)
	}
	return ''
}

/**
 * Maps domain errors and Supabase/PostgREST RPC failures to HTTP.
 */
export function messagingMutationErrorToHttp(error: unknown): {
	status: number
	body: { ok: false; error: string }
} {
	const msg = flattenErrorMessage(error)
	const lower = msg.toLowerCase()

	if (msg === 'NOT_FOUND' || msg.includes('CONVERSATION_NOT_FOUND')) {
		return { status: 404, body: { ok: false, error: 'Not found' } }
	}
	if (msg === 'FORBIDDEN' || msg.includes('NOT_PARTICIPANT')) {
		return { status: 403, body: { ok: false, error: 'Forbidden' } }
	}
	if (msg.includes('NOT_AUTHENTICATED') || lower.includes('jwt') || lower.includes('invalid login')) {
		return { status: 401, body: { ok: false, error: 'Unauthorized' } }
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
	if (msg === 'UPSERT_FAILED' || msg === 'INSERT_FAILED') {
		return { status: 500, body: { ok: false, error: 'Request failed' } }
	}
	return { status: 500, body: { ok: false, error: 'Request failed' } }
}
