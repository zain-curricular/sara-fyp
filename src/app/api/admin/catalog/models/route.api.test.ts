// ============================================================================
// API integration tests — GET, POST /api/admin/catalog/models
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

describe.skipIf(!canRunSupabaseIntegrationTests)('admin /api/admin/catalog/models', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('GET lists models for platform', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const res = await GET(buildRequest('/api/admin/catalog/models?platform=mobile'))
		expect(res.status).toBe(200)
		const body = await res.json()
		const ids = (body.data as { id: string }[]).map((m) => m.id)
		expect(ids).toContain(fx.modelActiveId)
		expect(ids).toContain(fx.modelInactiveId)
	})

	it('POST creates a model', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const slug = `api-model-new-${fx.suffix}`
		const res = await POST(
			buildJsonRequest('/api/admin/catalog/models', {
				brand_id: fx.brandId,
				category_id: fx.categoryActiveId,
				name: `New Model ${fx.suffix}`,
				slug,
				is_active: true,
			}),
		)
		expect(res.status).toBe(201)
		const body = await res.json()
		const { getAdmin } = await import('@/lib/supabase/clients/adminClient')
		await getAdmin().from('models').delete().eq('id', body.data.id as string)
	})
})
