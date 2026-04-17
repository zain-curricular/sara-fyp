// ============================================================================
// API integration tests — GET, POST /api/admin/catalog/specifications
// ============================================================================

import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({
	authenticateFromRequest: vi.fn(),
}))

import { GET, POST } from './route'
import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../../__tests__/integration'
import { buildRequest, buildJsonRequest } from '../../../../../../__tests__/api'
import { mockAuthenticatedUser } from '../../../../../../__tests__/api/mockAuth'

describe.skipIf(!canRunSupabaseIntegrationTests)('admin /api/admin/catalog/specifications', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('GET returns specification by model_id', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const res = await GET(
			buildRequest(`/api/admin/catalog/specifications?model_id=${fx.modelActiveId}`),
		)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.data.model_id).toBe(fx.modelActiveId)
	})

	it('POST creates specification for a new model', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const { getAdmin } = await import('@/lib/supabase/clients/adminClient')
		const admin = getAdmin()
		const slug = `api-spec-model-${fx.suffix}`
		const { data: m } = await admin
			.from('models')
			.insert({
				brand_id: fx.brandId,
				category_id: fx.categoryActiveId,
				name: `Spec Model ${fx.suffix}`,
				slug,
				is_active: true,
			})
			.select('id')
			.single()

		const modelId = m?.id as string
		const res = await POST(
			buildJsonRequest('/api/admin/catalog/specifications', {
				model_id: modelId,
				specs: { test: true },
			}),
		)
		expect(res.status).toBe(201)

		await admin.from('models').delete().eq('id', modelId)
	})
})
