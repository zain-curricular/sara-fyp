// ============================================================================
// Seed + cleanup — catalog API integration tests
// ============================================================================
//
// Creates real auth.users + profiles rows and catalog rows via service-role
// client. Call `cleanupCatalogApiFixture` in afterAll (reverse FK order).

import { createAdminSupabaseClient as getAdmin } from '@/lib/supabase/admin'

export type CatalogApiFixture = {
	adminUserId: string
	regularUserId: string
	categoryActiveId: string
	categoryInactiveId: string
	brandId: string
	modelActiveId: string
	modelInactiveId: string
	specificationId: string
	/** Slug prefix used for unique constraints in this run */
	suffix: string
}

function requireNoError<T>(label: string, error: unknown, data: T | null): asserts data is T {
	if (error || data === null) {
		throw new Error(`${label}: ${JSON.stringify(error)}`)
	}
}

/**
 * Inserts two users (admin + regular), active/inactive categories, one brand,
 * two models, and a specification for the active model.
 */
export async function seedCatalogApiFixture(): Promise<CatalogApiFixture> {
	const admin = getAdmin()
	const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

	const { data: adminUser, error: adminErr } = await admin.auth.admin.createUser({
		email: `catalog-api-admin-${suffix}@test.example.com`,
		password: 'TestCatalogApi123!@#',
		email_confirm: true,
	})
	requireNoError('createUser admin', adminErr, adminUser.user)
	const adminUserId = adminUser.user.id

	const { error: adminRoleErr } = await admin
		.from('profiles')
		.update({ role: 'admin' })
		.eq('id', adminUserId)
	if (adminRoleErr) {
		throw new Error(`profiles admin role: ${JSON.stringify(adminRoleErr)}`)
	}

	const { data: regUser, error: regErr } = await admin.auth.admin.createUser({
		email: `catalog-api-user-${suffix}@test.example.com`,
		password: 'TestCatalogApi123!@#',
		email_confirm: true,
	})
	requireNoError('createUser regular', regErr, regUser.user)
	const regularUserId = regUser.user.id

	const { data: catA, error: catAErr } = await admin
		.from('categories')
		.insert({
			platform: 'mobile',
			name: `API Cat A ${suffix}`,
			slug: `api-cat-a-${suffix}`,
			parent_id: null,
			position: 0,
			is_active: true,
			spec_schema: { ram_gb: 'number' },
		})
		.select('id')
		.single()
	requireNoError('insert category active', catAErr, catA)
	const categoryActiveId = catA.id as string

	const { data: catI, error: catIErr } = await admin
		.from('categories')
		.insert({
			platform: 'mobile',
			name: `API Cat I ${suffix}`,
			slug: `api-cat-i-${suffix}`,
			parent_id: null,
			position: 1,
			is_active: false,
			spec_schema: { foo: 'string' },
		})
		.select('id')
		.single()
	requireNoError('insert category inactive', catIErr, catI)
	const categoryInactiveId = catI.id as string

	const { data: brand, error: brandErr } = await admin
		.from('brands')
		.insert({
			platform: 'mobile',
			name: `API Brand ${suffix}`,
			slug: `api-brand-${suffix}`,
		})
		.select('id')
		.single()
	requireNoError('insert brand', brandErr, brand)
	const brandId = brand.id as string

	const { data: modA, error: modAErr } = await admin
		.from('models')
		.insert({
			brand_id: brandId,
			category_id: categoryActiveId,
			name: `API Model Active ${suffix}`,
			slug: `api-model-a-${suffix}`,
			is_active: true,
		})
		.select('id')
		.single()
	requireNoError('insert model active', modAErr, modA)
	const modelActiveId = modA.id as string

	const { data: modI, error: modIErr } = await admin
		.from('models')
		.insert({
			brand_id: brandId,
			category_id: categoryActiveId,
			name: `API Model Inactive ${suffix}`,
			slug: `api-model-i-${suffix}`,
			is_active: false,
		})
		.select('id')
		.single()
	requireNoError('insert model inactive', modIErr, modI)
	const modelInactiveId = modI.id as string

	const { data: spec, error: specErr } = await admin
		.from('specifications')
		.insert({
			model_id: modelActiveId,
			specs: { ram_gb: 8 },
		})
		.select('id')
		.single()
	requireNoError('insert specification', specErr, spec)
	const specificationId = spec.id as string

	return {
		adminUserId,
		regularUserId,
		categoryActiveId,
		categoryInactiveId,
		brandId,
		modelActiveId,
		modelInactiveId,
		specificationId,
		suffix,
	}
}

/**
 * Deletes catalog rows then auth users (order respects FKs).
 */
export async function cleanupCatalogApiFixture(f: CatalogApiFixture): Promise<void> {
	const admin = getAdmin()

	await admin.from('models').delete().in('id', [f.modelActiveId, f.modelInactiveId])
	await admin.from('brands').delete().eq('id', f.brandId)
	await admin.from('categories').delete().in('id', [f.categoryActiveId, f.categoryInactiveId])

	await admin.auth.admin.deleteUser(f.adminUserId)
	await admin.auth.admin.deleteUser(f.regularUserId)
}
