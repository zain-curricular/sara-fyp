// ============================================================================
// API integration tests — GET, POST /api/admin/catalog/categories
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

describe.skipIf(!canRunSupabaseIntegrationTests)('admin /api/admin/catalog/categories', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	describe('GET', () => {
		it('returns 401 when unauthenticated', async () => {
			mockUnauthenticated()
			const res = await GET(buildRequest('/api/admin/catalog/categories?platform=mobile'))
			expect(res.status).toBe(401)
		})

		it('returns 403 when not admin', async () => {
			mockAuthenticatedUser(fx.regularUserId)
			const res = await GET(buildRequest('/api/admin/catalog/categories?platform=mobile'))
			expect(res.status).toBe(403)
		})

		it('returns all categories including inactive for admin', async () => {
			mockAuthenticatedUser(fx.adminUserId)
			const res = await GET(buildRequest('/api/admin/catalog/categories?platform=mobile'))
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.ok).toBe(true)
			const ids = (body.data as { id: string }[]).map((c) => c.id)
			expect(ids).toContain(fx.categoryActiveId)
			expect(ids).toContain(fx.categoryInactiveId)
		})
	})

	describe('POST', () => {
		const createdIds: string[] = []

		afterAll(async () => {
			const { getAdmin } = await import('@/lib/supabase/clients/adminClient')
			const admin = getAdmin()
			for (const id of createdIds) {
				await admin.from('categories').delete().eq('id', id)
			}
		})

		it('returns 201 and creates a category', async () => {
			mockAuthenticatedUser(fx.adminUserId)
			const slug = `api-post-cat-${fx.suffix}`
			const res = await POST(
				buildJsonRequest('/api/admin/catalog/categories', {
					platform: 'mobile',
					name: `Posted ${fx.suffix}`,
					slug,
					is_active: true,
					spec_schema: {},
				}),
			)
			expect(res.status).toBe(201)
			const body = await res.json()
			expect(body.ok).toBe(true)
			expect(body.data.slug).toBe(slug)
			createdIds.push(body.data.id as string)
		})
	})
})
