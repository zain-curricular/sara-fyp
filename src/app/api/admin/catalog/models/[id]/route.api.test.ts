// ============================================================================
// API integration tests — GET, PATCH, DELETE /api/admin/catalog/models/[id]
// ============================================================================

import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({
	authenticateFromRequest: vi.fn(),
}))

import { GET, PATCH } from './route'
import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../../../__tests__/integration'
import { buildRequest, buildJsonRequest } from '../../../../../../../__tests__/api'
import { mockAuthenticatedUser } from '../../../../../../../__tests__/api/mockAuth'

describe.skipIf(!canRunSupabaseIntegrationTests)('admin /api/admin/catalog/models/[id]', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('GET returns model including inactive', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const res = await GET(buildRequest(`/api/admin/catalog/models/${fx.modelInactiveId}`), {
			params: Promise.resolve({ id: fx.modelInactiveId }),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.data.is_active).toBe(false)
	})

	it('PATCH toggles is_active', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const res = await PATCH(
			buildJsonRequest(
				`/api/admin/catalog/models/${fx.modelActiveId}`,
				{ is_active: false },
				'PATCH',
			),
			{ params: Promise.resolve({ id: fx.modelActiveId }) },
		)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.data.is_active).toBe(false)

		await PATCH(
			buildJsonRequest(
				`/api/admin/catalog/models/${fx.modelActiveId}`,
				{ is_active: true },
				'PATCH',
			),
			{ params: Promise.resolve({ id: fx.modelActiveId }) },
		)
	})
})
