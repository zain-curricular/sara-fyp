// ============================================================================
// API integration tests — GET /api/catalog/brands
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { GET } from './route'
import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../__tests__/integration'
import { buildRequest } from '../../../../../__tests__/api'

describe.skipIf(!canRunSupabaseIntegrationTests)('GET /api/catalog/brands', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('returns 400 when platform is missing', async () => {
		const res = await GET(buildRequest('/api/catalog/brands'))
		expect(res.status).toBe(400)
	})

	it('includes seeded brand for the platform', async () => {
		const res = await GET(buildRequest('/api/catalog/brands?platform=mobile'))
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		const ids = (body.data as { id: string }[]).map((b) => b.id)
		expect(ids).toContain(fx.brandId)
	})
})
