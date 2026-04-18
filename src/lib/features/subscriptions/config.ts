// ============================================================================
// Subscriptions — static plan catalog (no DB master table)
// ============================================================================

import type { SubscriptionTier } from '@/lib/supabase/database.types'

export type PlanDefinition = {
	tier: SubscriptionTier
	label: string
	max_active_listings: number
	max_featured_listings: number
	/** Monthly price in minor units (e.g. PKR paisa); 0 = free */
	price_monthly_minor: number
}

export const SUBSCRIPTION_PLANS: readonly PlanDefinition[] = [
	{
		tier: 'free',
		label: 'Free',
		max_active_listings: 5,
		max_featured_listings: 0,
		price_monthly_minor: 0,
	},
	{
		tier: 'premium',
		label: 'Premium',
		max_active_listings: 20,
		max_featured_listings: 2,
		price_monthly_minor: 999_00,
	},
	{
		tier: 'wholesale',
		label: 'Wholesale',
		max_active_listings: 100,
		max_featured_listings: 10,
		price_monthly_minor: 4999_00,
	},
] as const

export function getPlanByTier(tier: SubscriptionTier): PlanDefinition | undefined {
	return SUBSCRIPTION_PLANS.find((p) => p.tier === tier)
}

/** Paid checkout — free is default and not purchased via gateway */
export const PAID_SUBSCRIPTION_TIERS = ['premium', 'wholesale'] as const satisfies readonly SubscriptionTier[]
