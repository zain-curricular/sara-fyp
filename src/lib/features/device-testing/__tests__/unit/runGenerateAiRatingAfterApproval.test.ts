// ============================================================================
// runGenerateAiRatingAfterApproval — calls AI rating with listing owner as rate-limit user
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/features/ai-engine/services', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/lib/features/ai-engine/services')>()
	return {
		...actual,
		generateAiRating: vi.fn(),
	}
})

import { generateAiRating } from '@/lib/features/ai-engine/services'
import { runGenerateAiRatingAfterApproval } from '../../_utils/testReportWriteService'

describe('runGenerateAiRatingAfterApproval', () => {
	beforeEach(() => {
		vi.mocked(generateAiRating).mockReset()
	})

	it('invokes generateAiRating with listing.user_id', async () => {
		vi.mocked(generateAiRating).mockResolvedValue({
			data: { rating: { overall: 8 } as never },
			error: null,
		})

		await runGenerateAiRatingAfterApproval({
			listing: {
				id: 'l1',
				user_id: 'seller-1',
				category_id: 'c1',
				platform: 'mobile',
				title: 'Phone',
				details: {},
			} as import('@/lib/supabase/database.types').ListingRow,
			report: {
				id: 'rep1',
				order_id: 'o1',
				tester_id: 't1',
				inspection_results: {},
				overall_score: 8,
				overall_notes: null,
				passed: true,
				created_at: '',
				updated_at: '',
			},
			category: {
				id: 'c1',
				platform: 'mobile',
				name: 'Phones',
				slug: 'phones',
				parent_id: null,
				icon_url: null,
				position: 0,
				is_active: true,
				spec_schema: {},
				inspection_schema: {},
				created_at: '',
				updated_at: '',
			} as import('@/lib/supabase/database.types').CategoryRow,
		})

		expect(generateAiRating).toHaveBeenCalledTimes(1)
		expect(generateAiRating).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'seller-1',
				listing: expect.objectContaining({ id: 'l1' }),
				report: expect.objectContaining({ id: 'rep1', passed: true }),
			}),
		)
	})
})
