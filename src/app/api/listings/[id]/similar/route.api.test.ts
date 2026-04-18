// ============================================================================
// API tests — GET /api/listings/[id]/similar
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { GET } from './route'
import { buildRequest } from '../../../../../../__tests__/api'
import {
	canRunSupabaseIntegrationTests,
	cleanupCatalogApiFixture,
	seedCatalogApiFixture,
	type CatalogApiFixture,
} from '../../../../../../__tests__/integration'
import { getAdmin } from '@/lib/supabase/clients/adminClient'

describe('GET /api/listings/[id]/similar', () => {
	it('returns 404 for non-uuid id', async () => {
		const res = await GET(
			buildRequest('/api/listings/not-a-uuid/similar'),
			{ params: Promise.resolve({ id: 'not-a-uuid' }) },
		)
		expect(res.status).toBe(404)
	})

	it('returns 400 for invalid query', async () => {
		const id = '00000000-0000-4000-8000-000000000001'
		const res = await GET(buildRequest(`/api/listings/${id}/similar?limit=999`), {
			params: Promise.resolve({ id }),
		})
		expect(res.status).toBe(400)
	})
})

describe.skipIf(!canRunSupabaseIntegrationTests)('GET /api/listings/[id]/similar (integration)', () => {
	let fx: CatalogApiFixture
	let listingA: string
	let listingB: string

	beforeAll(async () => {
		fx = await seedCatalogApiFixture()
		const admin = getAdmin()
		const base = {
			user_id: fx.regularUserId,
			platform: 'mobile' as const,
			category_id: fx.categoryActiveId,
			model_id: fx.modelActiveId,
			sale_type: 'fixed' as const,
			price: 500,
			condition: 'good' as const,
			details: {},
			city: 'Lahore',
			status: 'active' as const,
			published_at: new Date().toISOString(),
		}
		const a = await admin
			.from('listings')
			.insert({ ...base, title: `Similar A ${fx.suffix}` })
			.select('id')
			.single()
		const b = await admin
			.from('listings')
			.insert({ ...base, title: `Similar B ${fx.suffix}` })
			.select('id')
			.single()
		if (a.error || !a.data || b.error || !b.data) {
			throw new Error(`seed similar listings: ${JSON.stringify({ a: a.error, b: b.error })}`)
		}
		listingA = a.data.id as string
		listingB = b.data.id as string
	})

	afterAll(async () => {
		const admin = getAdmin()
		await admin.from('listings').delete().in('id', [listingA, listingB])
		await cleanupCatalogApiFixture(fx)
	})

	it('returns a peer in the same category and price band', async () => {
		const res = await GET(buildRequest(`/api/listings/${listingA}/similar?limit=20`), {
			params: Promise.resolve({ id: listingA }),
		})
		expect(res.status).toBe(200)
		const body = (await res.json()) as { ok: boolean; data: { id: string }[] }
		expect(body.ok).toBe(true)
		const ids = body.data.map((x) => x.id)
		expect(ids).toContain(listingB)
	})

	it('returns 404 when no listing exists for id', async () => {
		const missing = '00000000-0000-4000-8000-00000000beef'
		const res = await GET(buildRequest(`/api/listings/${missing}/similar`), {
			params: Promise.resolve({ id: missing }),
		})
		expect(res.status).toBe(404)
	})
})
