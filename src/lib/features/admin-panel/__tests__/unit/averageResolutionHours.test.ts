// ============================================================================
// Unit tests — averageResolutionHoursFromSamples
// ============================================================================

import { describe, it, expect } from 'vitest'

import { averageResolutionHoursFromSamples } from '../../_utils/analyticsOps'

describe('averageResolutionHoursFromSamples', () => {
	it('returns null when no valid rows', () => {
		expect(averageResolutionHoursFromSamples([])).toEqual({ avgHours: null, sampleSize: 0 })
		expect(
			averageResolutionHoursFromSamples([
				{ created_at: 'invalid', resolved_at: '2020-01-02T00:00:00.000Z' },
			]),
		).toEqual({ avgHours: null, sampleSize: 0 })
	})

	it('skips inverted intervals', () => {
		const r = averageResolutionHoursFromSamples([
			{
				created_at: '2020-01-03T00:00:00.000Z',
				resolved_at: '2020-01-02T00:00:00.000Z',
			},
		])
		expect(r.sampleSize).toBe(0)
		expect(r.avgHours).toBeNull()
	})

	it('averages valid samples in hours', () => {
		const r = averageResolutionHoursFromSamples([
			{
				created_at: '2020-01-01T00:00:00.000Z',
				resolved_at: '2020-01-01T02:00:00.000Z',
			},
			{
				created_at: '2020-01-01T00:00:00.000Z',
				resolved_at: '2020-01-01T04:00:00.000Z',
			},
		])
		expect(r.sampleSize).toBe(2)
		expect(r.avgHours).toBe(3)
	})
})
