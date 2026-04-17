// ============================================================================
// API integration tests — GET, POST /api/admin/catalog/brands
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
import { mockAuthenticatedUser, mockUnauthenticated } from '../../../../../../__tests__/api/mockAuth'

describe.skipIf(!canRunSupabaseIntegrationTests)('admin /api/admin/catalog/brands', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('GET returns 401 when unauthenticated', async () => {
		mockUnauthenticated()
		const res = await GET(buildRequest('/api/admin/catalog/brands?platform=mobile'))
		expect(res.status).toBe(401)
	})

	it('GET returns brands for admin', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const res = await GET(buildRequest('/api/admin/catalog/brands?platform=mobile'))
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.data.map((b: { id: string }) => b.id)).toContain(fx.brandId)
	})

	it('POST creates a brand', async () => {
		mockAuthenticatedUser(fx.adminUserId)
		const slug = `api-brand-new-${fx.suffix}`
		const res = await POST(
			buildJsonRequest('/api/admin/catalog/brands', {
				platform: 'mobile',
				name: `Brand New ${fx.suffix}`,
				slug,
			}),
		)
		expect(res.status).toBe(201)
		const body = await res.json()
		expect(body.data.slug).toBe(slug)

		const { getAdmin } = await import('@/lib/supabase/clients/adminClient')
		await getAdmin().from('brands').delete().eq('id', body.data.id as string)
	})
})
