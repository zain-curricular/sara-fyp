// ============================================================================
// API integration tests — GET /api/catalog/models/[id]/specifications
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

describe.skipIf(!canRunSupabaseIntegrationTests)(
	'GET /api/catalog/models/[id]/specifications',
	() => {
		let fx: CatalogApiFixture

		beforeAll(async () => {
			fx = await seedCatalogApiFixture()
		})

		afterAll(async () => {
			await cleanupCatalogApiFixture(fx)
		})

		it('returns specification for active model', async () => {
			const res = await GET(
				buildRequest(`/api/catalog/models/${fx.modelActiveId}/specifications`),
				{ params: Promise.resolve({ id: fx.modelActiveId }) },
			)
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.ok).toBe(true)
			expect(body.data.id).toBe(fx.specificationId)
			expect(body.data.specs).toMatchObject({ ram_gb: 8 })
		})

		it('returns 404 for inactive model', async () => {
			const res = await GET(
				buildRequest(`/api/catalog/models/${fx.modelInactiveId}/specifications`),
				{ params: Promise.resolve({ id: fx.modelInactiveId }) },
			)
			expect(res.status).toBe(404)
		})
	},
)
