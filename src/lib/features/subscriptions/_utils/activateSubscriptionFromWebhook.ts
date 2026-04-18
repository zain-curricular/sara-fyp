// ============================================================================
// Subscriptions — activate plan after payment (webhook / manual completion)
// ============================================================================

import {
	completeSubscriptionEscrowAtomic,
	failSubscriptionEscrowAtomic,
} from '@/lib/features/subscriptions/_data-access/escrowTransactionsDafs'
import type { SubscriptionRow } from '@/lib/supabase/database.types'

/**
 * Marks escrow completed and inserts the new active subscription row (atomic DB RPC).
 */
export async function activateSubscriptionFromEscrowCompletion(
	escrowTransactionId: string,
	externalTxId?: string | null,
): Promise<{ data: SubscriptionRow | null; error: unknown }> {
	return completeSubscriptionEscrowAtomic(escrowTransactionId, externalTxId ?? null)
}

/** Marks a subscription escrow row as failed (no subscription row created). */
export async function markSubscriptionEscrowFailed(
	escrowTransactionId: string,
): Promise<{ error: unknown }> {
	return failSubscriptionEscrowAtomic(escrowTransactionId)
}
