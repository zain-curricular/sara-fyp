// ============================================================================
// Subscriptions — current plan + quota usage for the authenticated seller
// ============================================================================

import { getPlanByTier } from '@/lib/features/subscriptions/config'
import {
	countListingsTowardQuota,
	getActiveSubscriptionForUser,
} from '@/lib/features/subscriptions/_data-access/subscriptionsDafs'
import type { SubscriptionRow } from '@/lib/supabase/database.types'

export type MySubscriptionPayload = {
	subscription: SubscriptionRow | null
	plan: ReturnType<typeof getPlanByTier> | null
	listings_used: number
	max_active_listings: number
}

/**
 * Active row (if any), effective limits, and current listing count toward quota.
 */
export async function getMySubscription(userId: string): Promise<{
	data: MySubscriptionPayload | null
	error: unknown
}> {
	const [{ data: sub, error: sErr }, { data: used, error: cErr }] = await Promise.all([
		getActiveSubscriptionForUser(userId),
		countListingsTowardQuota(userId),
	])

	if (sErr) {
		return { data: null, error: sErr }
	}
	if (cErr) {
		return { data: null, error: cErr }
	}

	const tier = sub?.tier ?? 'free'
	const plan = getPlanByTier(tier)
	const max =
		sub?.max_active_listings ??
		plan?.max_active_listings ??
		getPlanByTier('free')?.max_active_listings ??
		5

	return {
		data: {
			subscription: sub,
			plan: plan ?? getPlanByTier('free') ?? null,
			listings_used: used,
			max_active_listings: max,
		},
		error: null,
	}
}
