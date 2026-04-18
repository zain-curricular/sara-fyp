// ============================================================================

import { describe, it, expect } from 'vitest'

import { buildListingDescriptionPrompt } from '../../_prompts/listingDescription'

describe('buildListingDescriptionPrompt', () => {
	it('uses automotive wording and includes category', () => {
		const p = buildListingDescriptionPrompt({
			platform: 'automotive',
			title: 'Honda Civic 2018',
			categoryName: 'Sedans',
			specSummary: 'year: 2018',
		})
		expect(p).toContain('vehicle')
		expect(p).toContain('Sedans')
		expect(p).toContain('Honda Civic 2018')
		expect(p).toContain('year: 2018')
	})

	it('uses mobile wording', () => {
		const p = buildListingDescriptionPrompt({
			platform: 'mobile',
			title: 'iPhone 14',
			categoryName: 'Phones',
			specSummary: 'ram_gb: 6',
		})
		expect(p).toContain('mobile device')
		expect(p).toContain('Phones')
	})
})
