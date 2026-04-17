// ============================================================================
// Onboarding — OTP delivery (stub; swap for Twilio/MessageBird in production)
// ============================================================================

export type OtpProvider = {
	send(input: { phone_number: string; code: string }): Promise<{ ok: boolean; error?: string }>
}

export const consoleOtpProvider: OtpProvider = {
	async send({ phone_number, code }) {
		console.log(`[OTP DEV] Phone: ${phone_number} Code: ${code}`)
		return { ok: true }
	},
}

export function getOtpProvider(): OtpProvider {
	return consoleOtpProvider
}
