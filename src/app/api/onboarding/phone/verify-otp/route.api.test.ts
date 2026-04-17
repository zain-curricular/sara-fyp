// ============================================================================
// API integration tests — POST /api/onboarding/phone/verify-otp
// ============================================================================

import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({
	authenticateFromRequest: vi.fn(),
}))

import { POST as postVerify } from './route'
import { POST as postSend } from '../send-otp/route'
import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../../__tests__/integration'
import { buildJsonRequest } from '../../../../../../__tests__/api'
import { mockAuthenticatedUser, mockUnauthenticated } from '../../../../../../__tests__/api/mockAuth'
import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { _clearOtpSendRateLimitForTests } from '@/lib/features/onboarding/_utils/otpSendRateLimit'
import { otpStore } from '@/lib/features/onboarding/_utils/otpStore'

describe.skipIf(!canRunSupabaseIntegrationTests)('POST /api/onboarding/phone/verify-otp', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	beforeEach(() => {
		otpStore._clearAll()
		_clearOtpSendRateLimitForTests()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	const phone = '+923001234567'

	it('returns 401 when unauthenticated', async () => {
		mockUnauthenticated()
		const res = await postVerify(
			buildJsonRequest('/api/onboarding/phone/verify-otp', {
				phone_number: phone,
				code: '123456',
			}),
		)
		expect(res.status).toBe(401)
	})

	it('verifies OTP, syncs phone_number, and sets phone_verified', async () => {
		mockAuthenticatedUser(fx.regularUserId)

		const sendRes = await postSend(
			buildJsonRequest('/api/onboarding/phone/send-otp', { phone_number: phone }),
		)
		expect(sendRes.status).toBe(200)

		const entry = otpStore.get(fx.regularUserId)
		expect(entry?.code).toMatch(/^\d{6}$/)

		const verifyRes = await postVerify(
			buildJsonRequest('/api/onboarding/phone/verify-otp', {
				phone_number: phone,
				code: entry!.code,
			}),
		)
		expect(verifyRes.status).toBe(200)
		const vBody = await verifyRes.json()
		expect(vBody.ok).toBe(true)
		expect(vBody.data.phone_verified).toBe(true)
		expect(vBody.data.phone_number).toBe(phone)

		const admin = getAdmin()
		const { data: row } = await admin
			.from('profiles')
			.select('phone_verified, phone_number')
			.eq('id', fx.regularUserId)
			.single()
		expect(row?.phone_verified).toBe(true)
		expect(row?.phone_number).toBe(phone)

		await admin.from('profiles').update({ phone_verified: false, phone_number: null }).eq('id', fx.regularUserId)
	})

	it('returns 400 on wrong code', async () => {
		mockAuthenticatedUser(fx.regularUserId)
		await postSend(buildJsonRequest('/api/onboarding/phone/send-otp', { phone_number: phone }))

		const verifyRes = await postVerify(
			buildJsonRequest('/api/onboarding/phone/verify-otp', {
				phone_number: phone,
				code: '000000',
			}),
		)
		expect(verifyRes.status).toBe(400)
	})
})
