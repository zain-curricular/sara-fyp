// ============================================================================
// API integration tests — GET, POST /api/listings
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
} from '../../../../__tests__/integration'
import { buildRequest, buildJsonRequest } from '../../../../__tests__/api'
import { mockAuthenticatedUser, mockUnauthenticated } from '../../../../__tests__/api/mockAuth'
import { getAdmin } from '@/lib/supabase/clients/adminClient'

describe.skipIf(!canRunSupabaseIntegrationTests)('/api/listings', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	describe('GET', () => {
		it('returns 400 when query params are invalid', async () => {
			const res = await GET(buildRequest('/api/listings?page=0'))
			expect(res.status).toBe(400)
			const body = await res.json()
			expect(body.ok).toBe(false)
		})

		it('returns 200 with listings search results', async () => {
			const res = await GET(buildRequest('/api/listings?platform=mobile&page=1&limit=20'))
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.ok).toBe(true)
			expect(Array.isArray(body.data)).toBe(true)
		})
	})

	describe('POST', () => {
		const createdIds: string[] = []

		afterAll(async () => {
			const admin = getAdmin()
			for (const id of createdIds) {
				await admin.from('listings').delete().eq('id', id)
			}
		})

		it('returns 401 when unauthenticated', async () => {
			mockUnauthenticated()
			const res = await POST(
				buildJsonRequest('/api/listings', {
					platform: 'mobile',
					category_id: fx.categoryActiveId,
					title: 'x',
					sale_type: 'fixed',
					price: 10,
					condition: 'good',
					details: { ram_gb: 8 },
					city: 'Lahore',
				}),
			)
			expect(res.status).toBe(401)
		})

		it('returns 201 and creates a draft listing', async () => {
			mockAuthenticatedUser(fx.regularUserId)
			const res = await POST(
				buildJsonRequest('/api/listings', {
					platform: 'mobile',
					category_id: fx.categoryActiveId,
					model_id: fx.modelActiveId,
					title: `API draft ${fx.suffix}`,
					sale_type: 'fixed',
					price: 150,
					condition: 'excellent',
					details: { ram_gb: 8 },
					city: 'Islamabad',
				}),
			)
			expect(res.status).toBe(201)
			const body = await res.json()
			expect(body.ok).toBe(true)
			expect(body.data.status).toBe('draft')
			createdIds.push(body.data.id as string)
		})
	})
})
