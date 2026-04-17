// ============================================================================
// API integration tests — GET /api/catalog/categories/[id]/schema
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { GET } from './route'
import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../../../__tests__/integration'
import { buildRequest } from '../../../../../../../__tests__/api'

describe.skipIf(!canRunSupabaseIntegrationTests)('GET /api/catalog/categories/[id]/schema', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('returns 404 for inactive category', async () => {
		const res = await GET(
			buildRequest(`/api/catalog/categories/${fx.categoryInactiveId}/schema`),
			{ params: Promise.resolve({ id: fx.categoryInactiveId }) },
		)
		expect(res.status).toBe(404)
	})

	it('returns spec_schema for active category', async () => {
		const res = await GET(
			buildRequest(`/api/catalog/categories/${fx.categoryActiveId}/schema`),
			{ params: Promise.resolve({ id: fx.categoryActiveId }) },
		)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(body.data).toMatchObject({ ram_gb: 'number' })
	})
})
