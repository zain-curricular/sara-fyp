// ============================================================================
// DAL integration tests — catalogDafs
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../__tests__/integration'
import { getCategoryById, listCategoriesByPlatform } from './catalogDafs'

describe.skipIf(!canRunSupabaseIntegrationTests)('catalogDafs', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('listCategoriesByPlatform includes seeded categories', async () => {
		const { data, error } = await listCategoriesByPlatform('mobile')
		expect(error).toBeNull()
		const ids = (data ?? []).map((c) => c.id)
		expect(ids).toContain(fx.categoryActiveId)
		expect(ids).toContain(fx.categoryInactiveId)
	})

	it('getCategoryById returns active category row', async () => {
		const { data, error } = await getCategoryById(fx.categoryActiveId)
		expect(error).toBeNull()
		expect(data?.id).toBe(fx.categoryActiveId)
		expect(data?.is_active).toBe(true)
	})
})
