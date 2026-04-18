// ============================================================================

import { describe, it, expect } from 'vitest'

import { ratingAutomotiveOutputSchema } from '../../_schemas/ratingAutomotive'
import { ratingMobileOutputSchema } from '../../_schemas/ratingMobile'

describe('ratingMobileOutputSchema', () => {
	it('accepts a valid payload', () => {
		const parsed = ratingMobileOutputSchema.safeParse({
			overall: 8,
			summary: 'Solid device.',
			pros: ['Good screen'],
			cons: ['Minor wear'],
			breakdown: {
				screen: 9,
				battery: 8,
				camera: 7,
				motherboard: 8,
				sensors: 8,
			},
		})
		expect(parsed.success).toBe(true)
	})

	it('rejects out-of-range scores', () => {
		const parsed = ratingMobileOutputSchema.safeParse({
			overall: 11,
			summary: 'x',
			pros: [],
			cons: [],
			breakdown: {
				screen: 9,
				battery: 8,
				camera: 7,
				motherboard: 8,
				sensors: 8,
			},
		})
		expect(parsed.success).toBe(false)
	})
})

describe('ratingAutomotiveOutputSchema', () => {
	it('accepts a valid payload', () => {
		const parsed = ratingAutomotiveOutputSchema.safeParse({
			overall: 7,
			summary: 'Fair condition.',
			pros: [],
			cons: [],
			breakdown: {
				engine: 7,
				transmission: 7,
				body: 6,
				electrical: 8,
				comfort: 7,
			},
		})
		expect(parsed.success).toBe(true)
	})
})
