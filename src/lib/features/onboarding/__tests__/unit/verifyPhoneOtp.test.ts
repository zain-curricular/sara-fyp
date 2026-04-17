// ============================================================================
// Unit tests — verifyPhoneOtp
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/features/profiles/services', () => ({
	updateProfile: vi.fn(),
}))

import { verifyPhoneOtp } from '@/lib/features/onboarding/_utils/verifyPhoneOtp'
import { createOtpEntry, otpStore } from '@/lib/features/onboarding/_utils/otpStore'
import { updateProfile } from '@/lib/features/profiles/services'

describe('verifyPhoneOtp', () => {
	beforeEach(() => {
		otpStore._clearAll()
		vi.mocked(updateProfile).mockReset()
	})

	it('returns INVALID_CODE when code does not match', async () => {
		otpStore.set('u1', createOtpEntry('111111', '+12025550123'))

		const { data, error } = await verifyPhoneOtp('u1', '+12025550123', '222222')

		expect(data).toBeNull()
		expect(error).toBe('INVALID_CODE')
		expect(updateProfile).not.toHaveBeenCalled()
	})

	it('returns PHONE_MISMATCH when phone differs', async () => {
		otpStore.set('u1', createOtpEntry('111111', '+12025550123'))

		const { data, error } = await verifyPhoneOtp('u1', '+12025550199', '111111')

		expect(data).toBeNull()
		expect(error).toBe('PHONE_MISMATCH')
	})

	it('returns OTP_EXPIRED when entry missing or expired', async () => {
		otpStore.set('u1', {
			code: '111111',
			phone_number: '+12025550123',
			expiresAt: Date.now() - 1000,
		})

		const { error } = await verifyPhoneOtp('u1', '+12025550123', '111111')
		expect(error).toBe('OTP_EXPIRED')
	})

	it('clears store and sets phone_verified on success', async () => {
		otpStore.set('u1', createOtpEntry('111111', '+12025550123'))
		vi.mocked(updateProfile).mockResolvedValue({
			data: { id: 'u1', phone_verified: true } as never,
			error: null,
		})

		const { data, error } = await verifyPhoneOtp('u1', '+12025550123', '111111')

		expect(error).toBeNull()
		expect(data).toMatchObject({ phone_verified: true })
		expect(otpStore.get('u1')).toBeUndefined()
		expect(updateProfile).toHaveBeenCalledWith('u1', {
			phone_number: '+12025550123',
			phone_verified: true,
		})
	})
})
