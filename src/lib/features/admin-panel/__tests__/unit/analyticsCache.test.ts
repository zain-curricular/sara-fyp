// ============================================================================
// Unit tests — admin analytics memo cache
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import {
	getAdminAnalyticsCache,
	setAdminAnalyticsCache,
	_clearAdminAnalyticsCacheForTests,
} from '@/lib/features/admin-panel/_utils/analyticsCache'
import { ADMIN_ANALYTICS_CACHE_TTL_MS } from '@/lib/features/admin-panel/config'

describe('admin analytics cache', () => {
	beforeEach(() => {
		_clearAdminAnalyticsCacheForTests()
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
		_clearAdminAnalyticsCacheForTests()
	})

	it('expires after TTL', () => {
		setAdminAnalyticsCache('k', { x: 1 })
		expect(getAdminAnalyticsCache<{ x: number }>('k')).toEqual({ x: 1 })
		vi.advanceTimersByTime(ADMIN_ANALYTICS_CACHE_TTL_MS + 1)
		expect(getAdminAnalyticsCache('k')).toBeNull()
	})
})
