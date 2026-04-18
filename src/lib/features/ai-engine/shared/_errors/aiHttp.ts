// ============================================================================
// AI Engine — map AiError to HTTP (thin API routes)
// ============================================================================

import { AiError } from './aiErrors'

export function aiErrorToHttp(error: unknown): { status: number; body: { ok: false; error: string } } {
	if (AiError.isAiError(error)) {
		switch (error.code) {
			case 'RATE_LIMIT':
				return { status: 429, body: { ok: false, error: 'Too many AI requests' } }
			case 'MODERATION_BLOCKED':
				return { status: 400, body: { ok: false, error: 'Content not allowed' } }
			case 'TIMEOUT':
				return { status: 504, body: { ok: false, error: 'AI request timed out' } }
			case 'MODEL_UNAVAILABLE':
				return { status: 503, body: { ok: false, error: 'AI service unavailable' } }
			case 'INVALID_OUTPUT':
				return { status: 502, body: { ok: false, error: 'Invalid AI response' } }
			default:
				return { status: 500, body: { ok: false, error: 'AI request failed' } }
		}
	}
	return { status: 500, body: { ok: false, error: 'AI request failed' } }
}
