// ============================================================================
// In-memory send-OTP rate limit (per authenticated user)
// ============================================================================
//
// Complements OTP storage: limits how often a user can request codes. Replace
// with Redis + shared limits when running multiple Node instances.

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

const attemptsByUser = new Map<string, number[]>()

function prune(userId: string, now: number): number[] {
	const windowStart = now - WINDOW_MS
	const prev = attemptsByUser.get(userId) ?? []
	return prev.filter((t) => t > windowStart)
}

/**
 * Records one send attempt. Returns false when the user exceeded the window cap.
 */
export function tryRecordOtpSend(userId: string): boolean {
	const now = Date.now()
	const recent = prune(userId, now)
	if (recent.length >= MAX_ATTEMPTS) {
		return false
	}
	recent.push(now)
	attemptsByUser.set(userId, recent)
	return true
}

/** @internal Vitest / API tests */
export function _clearOtpSendRateLimitForTests(): void {
	attemptsByUser.clear()
}
