// ============================================================================
// API integration tests — GET /api/catalog/models
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

describe.skipIf(!canRunSupabaseIntegrationTests)('GET /api/catalog/models', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('returns 400 when q is too short', async () => {
		const res = await GET(buildRequest('/api/catalog/models?q=a&platform=mobile'))
		expect(res.status).toBe(400)
	})

	it('finds active model by name substring', async () => {
		const term = encodeURIComponent('API Model Active')
		const res = await GET(
			buildRequest(`/api/catalog/models?q=${term}&platform=mobile`),
		)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		const ids = (body.data as { id: string }[]).map((m) => m.id)
		expect(ids).toContain(fx.modelActiveId)
		expect(ids).not.toContain(fx.modelInactiveId)
	})
})
