// ============================================================================
// API integration tests — POST /api/onboarding/phone/send-otp
// ============================================================================

import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({
	authenticateFromRequest: vi.fn(),
}))

import { POST } from './route'
import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../../__tests__/integration'
import { buildJsonRequest } from '../../../../../../__tests__/api'
import { mockAuthenticatedUser, mockUnauthenticated } from '../../../../../../__tests__/api/mockAuth'
import { _clearOtpSendRateLimitForTests } from '@/lib/features/onboarding/_utils/otpSendRateLimit'
import { otpStore } from '@/lib/features/onboarding/_utils/otpStore'

describe.skipIf(!canRunSupabaseIntegrationTests)('POST /api/onboarding/phone/send-otp', () => {
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
		const res = await POST(buildJsonRequest('/api/onboarding/phone/send-otp', { phone_number: phone }))
		expect(res.status).toBe(401)
	})

	it('returns 200 when authenticated', async () => {
		mockAuthenticatedUser(fx.regularUserId)
		const res = await POST(buildJsonRequest('/api/onboarding/phone/send-otp', { phone_number: phone }))
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
	})

	it('returns 429 after too many send attempts', async () => {
		mockAuthenticatedUser(fx.regularUserId)
		for (let i = 0; i < 5; i++) {
			const res = await POST(buildJsonRequest('/api/onboarding/phone/send-otp', { phone_number: phone }))
			expect(res.status).toBe(200)
		}
		const res = await POST(buildJsonRequest('/api/onboarding/phone/send-otp', { phone_number: phone }))
		expect(res.status).toBe(429)
	})
})
