// ============================================================================
// API integration tests — GET /api/subscriptions/me
// ============================================================================

import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({
	authenticateFromRequest: vi.fn(),
}))

import { GET } from './route'
import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../__tests__/integration'
import { buildRequest } from '../../../../../__tests__/api'
import { mockAuthenticatedUser, mockUnauthenticated } from '../../../../../__tests__/api/mockAuth'

describe.skipIf(!canRunSupabaseIntegrationTests)('GET /api/subscriptions/me', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('returns 401 when unauthenticated', async () => {
		mockUnauthenticated()
		const res = await GET(buildRequest('/api/subscriptions/me'))
		expect(res.status).toBe(401)
	})

	it('returns 200 with plan payload for authenticated seller', async () => {
		mockAuthenticatedUser(fx.regularUserId)
		const res = await GET(buildRequest('/api/subscriptions/me'))
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(body.data).toMatchObject({
			listings_used: expect.any(Number),
			max_active_listings: expect.any(Number),
		})
		expect(body.data.plan).toBeTruthy()
	})
})
