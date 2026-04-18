// ============================================================================

import { describe, it, expect } from 'vitest'

import { extractListingDetailsForPrompt } from '../../_utils/extractListingDetailsForPrompt'

describe('extractListingDetailsForPrompt', () => {
	it('includes only spec_schema keys present in details', () => {
		const spec = { ram_gb: 'number', color: 'string' }
		const details = { ram_gb: 8, color: 'black', extra: 'ignored' }
		expect(extractListingDetailsForPrompt(spec, details)).toBe('ram_gb: 8\ncolor: black')
	})

	it('returns placeholder when no fields are set', () => {
		const spec = { a: 'string' }
		expect(extractListingDetailsForPrompt(spec, {})).toBe('No spec fields filled yet.')
	})

	it('formats booleans', () => {
		expect(extractListingDetailsForPrompt({ x: 'boolean' }, { x: true })).toBe('x: true')
	})
})
