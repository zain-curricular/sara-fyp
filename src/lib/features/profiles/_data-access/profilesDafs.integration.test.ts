// ============================================================================
// DAL integration tests — profilesDafs
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../__tests__/integration'
import { getProfileById, getProfileByHandle } from './profilesDafs'

describe.skipIf(!canRunSupabaseIntegrationTests)('profilesDafs', () => {
	let fx: CatalogApiFixture

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
	})

	afterAll(async () => {
		await cleanupCatalogApiFixture(fx)
	})

	it('getProfileById returns the seeded user profile', async () => {
		const { data, error } = await getProfileById(fx.regularUserId)
		expect(error).toBeNull()
		expect(data?.id).toBe(fx.regularUserId)
		expect(data?.email).toBeDefined()
	})

	it('getProfileByHandle returns null for unknown handle', async () => {
		const { data, error } = await getProfileByHandle(`no-such-handle-${fx.suffix}`)
		expect(error).toBeNull()
		expect(data).toBeNull()
	})
})
