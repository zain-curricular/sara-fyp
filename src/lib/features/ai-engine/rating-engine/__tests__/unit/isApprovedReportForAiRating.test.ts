// ============================================================================

import { describe, it, expect } from 'vitest'

import { isApprovedReportForAiRating } from '../../services'
import type { TestReportRow } from '@/lib/supabase/database.types'

function row(passed: boolean | null): TestReportRow {
	return {
		id: 'r1',
		order_id: 'o1',
		tester_id: 't1',
		inspection_results: {},
		overall_score: 8,
		overall_notes: null,
		passed,
		created_at: '',
		updated_at: '',
	}
}

describe('isApprovedReportForAiRating', () => {
	it('returns true only when passed is true', () => {
		expect(isApprovedReportForAiRating(row(true))).toBe(true)
		expect(isApprovedReportForAiRating(row(false))).toBe(false)
		expect(isApprovedReportForAiRating(row(null))).toBe(false)
		expect(isApprovedReportForAiRating(null)).toBe(false)
	})
})
