// ============================================================================
// Unit tests — publicCatalog (active-only rules)
// ============================================================================
//
// Mocks the data-access re-export layer (same module `publicCatalog` imports).

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/features/product-catalog/_data-access/catalogDafs', () => ({
	listCategoriesByPlatform: vi.fn(),
	getCategoryById: vi.fn(),
	listBrandsByPlatform: vi.fn(),
	searchModelsByName: vi.fn(),
	getModelById: vi.fn(),
	getSpecificationByModelId: vi.fn(),
}))

import * as dafs from '@/lib/features/product-catalog/_data-access/catalogDafs'
import {
	listCategoriesPublic,
	getCategorySpecSchemaPublic,
	getModelPublic,
} from '@/lib/features/product-catalog/_utils/publicCatalog'
import type { CategoryRow, ModelRow } from '@/lib/features/product-catalog/types'

describe('listCategoriesPublic', () => {
	beforeEach(() => {
		vi.mocked(dafs.listCategoriesByPlatform).mockReset()
	})

	it('returns only active categories', async () => {
		const rows: CategoryRow[] = [
			{
				id: '00000000-0000-4000-8000-000000000001',
				platform: 'mobile',
				name: 'A',
				slug: 'a',
				parent_id: null,
				icon_url: null,
				position: 0,
				is_active: true,
				spec_schema: {},
				inspection_schema: {},
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
			{
				id: '00000000-0000-4000-8000-000000000002',
				platform: 'mobile',
				name: 'B',
				slug: 'b',
				parent_id: null,
				icon_url: null,
				position: 1,
				is_active: false,
				spec_schema: {},
				inspection_schema: {},
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
		]

		vi.mocked(dafs.listCategoriesByPlatform).mockResolvedValue({ data: rows, error: null })

		const { data, error } = await listCategoriesPublic('mobile')

		expect(error).toBeNull()
		expect(data).toHaveLength(1)
		expect(data?.[0]?.slug).toBe('a')
	})
})

describe('getCategorySpecSchemaPublic', () => {
	beforeEach(() => {
		vi.mocked(dafs.getCategoryById).mockReset()
	})

	it('returns null data when category is inactive', async () => {
		const row: CategoryRow = {
			id: '00000000-0000-4000-8000-000000000001',
			platform: 'mobile',
			name: 'A',
			slug: 'a',
			parent_id: null,
			icon_url: null,
			position: 0,
			is_active: false,
			spec_schema: { ram_gb: 'number' },
			inspection_schema: {},
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		vi.mocked(dafs.getCategoryById).mockResolvedValue({ data: row, error: null })

		const { data, error } = await getCategorySpecSchemaPublic(row.id)

		expect(error).toBeNull()
		expect(data).toBeNull()
	})
})

describe('getModelPublic', () => {
	beforeEach(() => {
		vi.mocked(dafs.getModelById).mockReset()
	})

	it('returns null data when model is inactive', async () => {
		const row: ModelRow = {
			id: '00000000-0000-4000-8000-000000000001',
			brand_id: '00000000-0000-4000-8000-000000000010',
			category_id: '00000000-0000-4000-8000-000000000020',
			name: 'X',
			slug: 'x',
			year: null,
			image_url: null,
			is_active: false,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		vi.mocked(dafs.getModelById).mockResolvedValue({ data: row, error: null })

		const { data, error } = await getModelPublic(row.id)

		expect(error).toBeNull()
		expect(data).toBeNull()
	})
})
