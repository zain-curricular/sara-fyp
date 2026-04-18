// ============================================================================
// Subscriptions — start paid checkout (stub redirect + pending escrow row)
// ============================================================================

import { getPlanByTier, PAID_SUBSCRIPTION_TIERS } from '@/lib/features/subscriptions/config'
import { insertSubscriptionHoldEscrow } from '@/lib/features/subscriptions/_data-access/escrowTransactionsDafs'
import type { SubscriptionTier } from '@/lib/supabase/database.types'

function isPaidTier(t: SubscriptionTier): t is (typeof PAID_SUBSCRIPTION_TIERS)[number] {
	return (PAID_SUBSCRIPTION_TIERS as readonly string[]).includes(t)
}

/**
 * Creates a pending `escrow_transactions` hold for a subscription upgrade.
 * Returns a placeholder payment URL until a real gateway is wired.
 */
export async function startSubscriptionCheckout(
	userId: string,
	targetTier: SubscriptionTier,
): Promise<{
	data: { escrow_transaction_id: string; redirect_url: string; amount: number } | null
	error: unknown
}> {
	if (!isPaidTier(targetTier)) {
		return { data: null, error: new Error('INVALID_TIER') }
	}

	const plan = getPlanByTier(targetTier)
	if (!plan || plan.price_monthly_minor <= 0) {
		return { data: null, error: new Error('INVALID_TIER') }
	}

	const amount = Math.round(plan.price_monthly_minor) / 100

	const { data: row, error } = await insertSubscriptionHoldEscrow({
		amount,
		userId,
		targetTier,
		paymentMethod: 'stripe',
	})

	if (error || !row) {
		return { data: null, error: error ?? 'INSERT_FAILED' }
	}

	const redirect_url = `/checkout/subscription?tx=${encodeURIComponent(row.id)}`

	return {
		data: {
			escrow_transaction_id: row.id,
			redirect_url,
			amount,
		},
		error: null,
	}
}
