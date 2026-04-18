// ============================================================================
// Unit tests — listPlans / plan catalog
// ============================================================================

import { describe, it, expect } from 'vitest'

import { getPlanByTier, SUBSCRIPTION_PLANS } from '@/lib/features/subscriptions/config'
import { listPlans } from '@/lib/features/subscriptions/_utils/listPlans'

describe('listPlans', () => {
	it('returns the static catalog', () => {
		const plans = listPlans()
		expect(plans).toBe(SUBSCRIPTION_PLANS)
		expect(plans.map((p) => p.tier)).toEqual(['free', 'premium', 'wholesale'])
	})

	it('getPlanByTier resolves limits for premium', () => {
		expect(getPlanByTier('premium')?.max_active_listings).toBe(20)
	})
})
