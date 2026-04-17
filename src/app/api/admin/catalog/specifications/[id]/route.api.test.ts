// ============================================================================
// API integration tests — GET, PATCH, DELETE /api/admin/catalog/specifications/[id]
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

describe.skipIf(!canRunSupabaseIntegrationTests)('admin /api/admin/catalog/specifications/[id]', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('GET returns specification by id', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const res = await GET(
			buildRequest(`/api/admin/catalog/specifications/${fx.specificationId}`),
			{ params: Promise.resolve({ id: fx.specificationId }) },
		)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.data.id).toBe(fx.specificationId)
	})

	it('PATCH updates specs JSON', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const res = await PATCH(
			buildJsonRequest(
				`/api/admin/catalog/specifications/${fx.specificationId}`,
				{ specs: { ram_gb: 12, updated: true } },
				'PATCH',
			),
			{ params: Promise.resolve({ id: fx.specificationId }) },
		)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.data.specs).toMatchObject({ ram_gb: 12, updated: true })
	})
})
