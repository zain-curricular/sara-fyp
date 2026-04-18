// ============================================================================
// Subscriptions — admin assign / update tier and limits
// ============================================================================

import { getPlanByTier } from '@/lib/features/subscriptions/config'
import {
	deactivateActiveSubscriptionsForUser,
	getSubscriptionById,
	insertSubscription,
	updateSubscriptionById,
} from '@/lib/features/subscriptions/_data-access/subscriptionsDafs'
import type { AdminCreateSubscriptionInput, AdminPatchSubscriptionInput } from '@/lib/features/subscriptions/schemas'
import type { SubscriptionRow, SubscriptionTier } from '@/lib/supabase/database.types'
import type { Database } from '@/lib/supabase/database.types'

type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']

/**
 * Creates a new active subscription for a user (deactivates prior actives).
 */
export async function adminCreateSubscription(
	input: AdminCreateSubscriptionInput,
): Promise<{ data: SubscriptionRow | null; error: unknown }> {
	const plan = getPlanByTier(input.tier)
	if (!plan) {
		return { data: null, error: new Error('UNKNOWN_TIER') }
	}

	const { error: dErr } = await deactivateActiveSubscriptionsForUser(input.user_id)
	if (dErr) {
		return { data: null, error: dErr }
	}

	const expires =
		input.expires_at ??
		(() => {
			const d = new Date()
			d.setDate(d.getDate() + 365)
			return d.toISOString()
		})()

	return insertSubscription({
		user_id: input.user_id,
		tier: input.tier,
		starts_at: new Date().toISOString(),
		expires_at: expires,
		max_active_listings: input.max_active_listings ?? plan.max_active_listings,
		max_featured_listings: input.max_featured_listings ?? plan.max_featured_listings,
		is_active: true,
	})
}

/**
 * Partial update of a subscription row (admin tooling).
 */
export async function adminPatchSubscription(
	subscriptionId: string,
	patch: AdminPatchSubscriptionInput,
): Promise<{ data: SubscriptionRow | null; error: unknown }> {
	const { data: existing, error: gErr } = await getSubscriptionById(subscriptionId)
	if (gErr) {
		return { data: null, error: gErr }
	}
	if (!existing) {
		return { data: null, error: new Error('NOT_FOUND') }
	}

	const update: SubscriptionUpdate = {}

	if (patch.tier !== undefined) {
		const plan = getPlanByTier(patch.tier as SubscriptionTier)
		if (!plan) {
			return { data: null, error: new Error('UNKNOWN_TIER') }
		}
		update.tier = patch.tier
		update.max_active_listings = patch.max_active_listings ?? plan.max_active_listings
		update.max_featured_listings = patch.max_featured_listings ?? plan.max_featured_listings
	} else {
		if (patch.max_active_listings !== undefined) {
			update.max_active_listings = patch.max_active_listings
		}
		if (patch.max_featured_listings !== undefined) {
			update.max_featured_listings = patch.max_featured_listings
		}
	}

	if (patch.expires_at !== undefined) {
		update.expires_at = patch.expires_at
	}
	if (patch.is_active !== undefined) {
		update.is_active = patch.is_active
	}

	if (Object.keys(update).length === 0) {
		return { data: existing, error: null }
	}

	return updateSubscriptionById(subscriptionId, update)
}
