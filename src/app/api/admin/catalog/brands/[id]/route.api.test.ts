// ============================================================================
// API integration tests — GET, PATCH, DELETE /api/admin/catalog/brands/[id]
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

describe.skipIf(!canRunSupabaseIntegrationTests)('admin /api/admin/catalog/brands/[id]', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('GET returns brand for admin', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const res = await GET(buildRequest(`/api/admin/catalog/brands/${fx.brandId}`), {
			params: Promise.resolve({ id: fx.brandId }),
		})
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.data.id).toBe(fx.brandId)
	})

	it('PATCH updates brand name', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const newName = `Renamed ${fx.suffix}`
		const res = await PATCH(
			buildJsonRequest(`/api/admin/catalog/brands/${fx.brandId}`, { name: newName }, 'PATCH'),
			{ params: Promise.resolve({ id: fx.brandId }) },
		)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.data.name).toBe(newName)
	})
})
