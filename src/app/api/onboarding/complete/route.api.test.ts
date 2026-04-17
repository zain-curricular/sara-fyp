// ============================================================================
// API integration tests — POST /api/onboarding/complete
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
} from '../../../../../__tests__/integration'
import { buildJsonRequest } from '../../../../../__tests__/api'
import { mockAuthenticatedUser, mockUnauthenticated } from '../../../../../__tests__/api/mockAuth'
import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { _clearOtpSendRateLimitForTests } from '@/lib/features/onboarding/_utils/otpSendRateLimit'
import { otpStore } from '@/lib/features/onboarding/_utils/otpStore'

describe.skipIf(!canRunSupabaseIntegrationTests)('POST /api/onboarding/complete', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	beforeEach(() => {
		otpStore._clearAll()
		_clearOtpSendRateLimitForTests()
	})

	const phone = '+923001234567'

	async function resetRegularProfile() {
		const admin = getAdmin()
		await admin
			.from('profiles')
			.update({
				display_name: 'Catalog User',
				phone_number: null,
				phone_verified: false,
				city: null,
				handle: null,
				onboarding_completed_at: null,
				locale: 'en',
			})
			.eq('id', fx.regularUserId)
	}

	afterAll(async () => {
		await resetRegularProfile()
		await cleanupCatalogApiFixture(fx)
	})

	it('returns 401 when unauthenticated', async () => {
		mockUnauthenticated()
		const res = await POST(
			buildJsonRequest('/api/onboarding/complete', {
				display_name: 'N',
				phone_number: phone,
				city: 'Lahore',
			}),
		)
		expect(res.status).toBe(401)
	})

	it('returns 200 and updates profile', async () => {
		mockAuthenticatedUser(fx.regularUserId)
		const handle = `onb_${fx.suffix.replace(/[^a-z0-9_]/g, '_').slice(0, 20)}`

		const res = await POST(
			buildJsonRequest('/api/onboarding/complete', {
				display_name: 'Onboarded',
				phone_number: phone,
				city: 'Lahore',
				handle,
				locale: 'en',
			}),
		)

		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(body.data.display_name).toBe('Onboarded')
		expect(body.data.city).toBe('Lahore')
		expect(body.data.handle).toBe(handle)
		expect(body.data.onboarding_completed_at).toBeTruthy()

		await resetRegularProfile()
	})
})
