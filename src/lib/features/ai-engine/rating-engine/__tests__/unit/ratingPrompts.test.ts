// ============================================================================

import { describe, it, expect } from 'vitest'

import { buildRatingPromptAutomotive } from '../../_prompts/ratingAutomotive'
import { buildRatingPromptMobile } from '../../_prompts/ratingMobile'

describe('buildRatingPromptMobile', () => {
	it('includes category and inspection JSON', () => {
		const p = buildRatingPromptMobile({
			listingTitle: 'iPhone',
			platform: 'mobile',
			categoryName: 'Phones',
			specSchema: { ram_gb: 'number' },
			listingDetails: { ram_gb: 8 },
			inspectionResults: { screen: { ok: true } },
			overallScore: 8,
			overallNotes: 'ok',
			passed: true,
		})
		expect(p).toContain('Phones')
		expect(p).toContain('iPhone')
		expect(p).toContain('screen')
	})
})

describe('buildRatingPromptAutomotive', () => {
	it('includes automotive breakdown hints', () => {
		const p = buildRatingPromptAutomotive({
			listingTitle: 'Civic',
			platform: 'automotive',
			categoryName: 'Sedans',
			specSchema: {},
			listingDetails: {},
			inspectionResults: {},
			overallScore: null,
			overallNotes: null,
			passed: true,
		})
		expect(p).toContain('engine')
		expect(p).toContain('Sedans')
	})
})
