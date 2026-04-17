// ============================================================================
// API integration tests — GET /api/catalog/categories
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

describe.skipIf(!canRunSupabaseIntegrationTests)('GET /api/catalog/categories', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('returns 400 when query params are invalid', async () => {
		const res = await GET(buildRequest('/api/catalog/categories'))
		expect(res.status).toBe(400)
		const body = await res.json()
		expect(body.ok).toBe(false)
	})

	it('returns only active categories for the platform', async () => {
		const res = await GET(buildRequest('/api/catalog/categories?platform=mobile'))
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		const ids = (body.data as { id: string }[]).map((c) => c.id)
		expect(ids).toContain(fx.categoryActiveId)
		expect(ids).not.toContain(fx.categoryInactiveId)
	})
})
