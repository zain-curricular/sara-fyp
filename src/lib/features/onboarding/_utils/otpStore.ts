// ============================================================================
// Onboarding — in-memory OTP store (replace with Redis in production)
// ============================================================================
//
// Single-process only: multiple Node instances do not share this map.

export type OtpEntry = {
	code: string
	phone_number: string
	expiresAt: number
}

const store = new Map<string, OtpEntry>()

const OTP_TTL_MS = 10 * 60 * 1000

export const otpStore = {
	set(userId: string, entry: OtpEntry): void {
		store.set(userId, entry)
	},

	get(userId: string): OtpEntry | undefined {
		return store.get(userId)
	},

	delete(userId: string): void {
		store.delete(userId)
	},

	/** @internal tests */
	_clearAll(): void {
		store.clear()
	},
}

export function createOtpEntry(code: string, phone_number: string): OtpEntry {
	return {
		code,
		phone_number,
		expiresAt: Date.now() + OTP_TTL_MS,
	}
}
