// ============================================================================
// AI Engine — map unknown failures to AiError
// ============================================================================

import { AiError } from '../_errors/aiErrors'

function isAbortError(e: unknown): boolean {
	if (e instanceof Error && e.name === 'AbortError') {
		return true
	}
	if (typeof DOMException !== 'undefined' && e instanceof DOMException && e.name === 'AbortError') {
		return true
	}
	return false
}

export function classifyAiError(e: unknown): AiError {
	if (e instanceof AiError) {
		return e
	}
	if (isAbortError(e)) {
		return new AiError('TIMEOUT', e instanceof Error ? e.message : 'Aborted')
	}
	const msg = e instanceof Error ? e.message : String(e)
	const lower = msg.toLowerCase()
	if (lower.includes('invalid') && (lower.includes('json') || lower.includes('schema') || lower.includes('output'))) {
		return new AiError('INVALID_OUTPUT', msg)
	}
	if (lower.includes('model') && (lower.includes('not found') || lower.includes('unknown'))) {
		return new AiError('MODEL_UNAVAILABLE', msg)
	}
	return new AiError('UNKNOWN', msg)
}
