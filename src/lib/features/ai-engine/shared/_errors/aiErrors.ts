// ============================================================================
// AI Engine — domain errors (services throw; routes map to HTTP)
// ============================================================================

export type AiErrorCode =
	| 'RATE_LIMIT'
	| 'MODEL_UNAVAILABLE'
	| 'TIMEOUT'
	| 'MODERATION_BLOCKED'
	| 'INVALID_OUTPUT'
	| 'UNKNOWN'

export class AiError extends Error {
	readonly code: AiErrorCode

	constructor(code: AiErrorCode, message?: string) {
		super(message ?? code)
		this.name = 'AiError'
		this.code = code
	}

	static isAiError(e: unknown): e is AiError {
		return e instanceof AiError
	}
}
