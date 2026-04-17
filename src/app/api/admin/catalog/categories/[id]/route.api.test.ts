// ============================================================================
// API integration tests — GET, PATCH, DELETE /api/admin/catalog/categories/[id]
// ============================================================================

import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({
	authenticateFromRequest: vi.fn(),
}))

import { GET, PATCH, DELETE } from './route'
import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../../../__tests__/integration'
import { buildRequest, buildJsonRequest } from '../../../../../../../__tests__/api'
import { mockAuthenticatedUser } from '../../../../../../../__tests__/api/mockAuth'

describe.skipIf(!canRunSupabaseIntegrationTests)('admin /api/admin/catalog/categories/[id]', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('GET returns one category for admin', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const res = await GET(
			buildRequest(`/api/admin/catalog/categories/${fx.categoryActiveId}`),
			{ params: Promise.resolve({ id: fx.categoryActiveId }) },
		)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.data.id).toBe(fx.categoryActiveId)
	})

	it('PATCH updates a category', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const res = await PATCH(
			buildJsonRequest(
				`/api/admin/catalog/categories/${fx.categoryActiveId}`,
				{ position: 42 },
				'PATCH',
			),
			{ params: Promise.resolve({ id: fx.categoryActiveId }) },
		)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.data.position).toBe(42)
	})

	it('DELETE removes a category (cleanup uses remaining fixture ids)', async () => {
		const { getAdmin } = await import('@/lib/supabase/clients/adminClient')
		const admin = getAdmin()
		const suffix = `${fx.suffix}-del`
		const { data: row } = await admin
			.from('categories')
			.insert({
				platform: 'mobile',
				name: `Del ${suffix}`,
				slug: `api-del-cat-${suffix}`,
				position: 0,
				is_active: true,
				spec_schema: {},
			})
			.select('id')
			.single()

		const id = row?.id as string
		mockAuthenticatedUser(fx.adminUserId)
		const res = await DELETE(buildRequest(`/api/admin/catalog/categories/${id}`), {
			params: Promise.resolve({ id }),
		})
		expect(res.status).toBe(200)
	})
})
