// ============================================================================
// Unit tests — sendPhoneOtp
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/features/onboarding/_providers/otpProvider', () => ({
	getOtpProvider: vi.fn(),
}))

import { sendPhoneOtp } from '@/lib/features/onboarding/_utils/sendPhoneOtp'
import { getOtpProvider } from '@/lib/features/onboarding/_providers/otpProvider'
import { otpStore } from '@/lib/features/onboarding/_utils/otpStore'
import { _clearOtpSendRateLimitForTests } from '@/lib/features/onboarding/_utils/otpSendRateLimit'

describe('sendPhoneOtp', () => {
	beforeEach(() => {
		otpStore._clearAll()
		_clearOtpSendRateLimitForTests()
		vi.mocked(getOtpProvider).mockReturnValue({
			send: vi.fn().mockResolvedValue({ ok: true }),
		})
	})

	it('returns RATE_LIMITED after too many sends in the window', async () => {
		const phone = '+12025550123'
		for (let i = 0; i < 5; i++) {
			const { error } = await sendPhoneOtp('u1', phone)
			expect(error).toBeNull()
		}
		const { error } = await sendPhoneOtp('u1', phone)
		expect(error).toBe('RATE_LIMITED')
	})

	it('stores OTP and sends via provider', async () => {
		const send = vi.fn().mockResolvedValue({ ok: true })
		vi.mocked(getOtpProvider).mockReturnValue({ send })

		const { error } = await sendPhoneOtp('u1', '+12025550123')
		expect(error).toBeNull()
		expect(otpStore.get('u1')?.code).toMatch(/^\d{6}$/)
		expect(send).toHaveBeenCalled()
	})
})
