// ============================================================================
// Subscriptions — public plan catalog (static config)
// ============================================================================

import { SUBSCRIPTION_PLANS } from '@/lib/features/subscriptions/config'
import type { PlanDefinition } from '@/lib/features/subscriptions/config'

/**
 * Returns the three static tiers for marketing and checkout UI.
 */
export function listPlans(): readonly PlanDefinition[] {
	return SUBSCRIPTION_PLANS
}
