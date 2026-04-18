// ============================================================================
// Subscriptions — data access (typed admin client)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import type { Database, SubscriptionRow } from '@/lib/supabase/database.types'

type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']

const subscriptionColumns =
	'id, user_id, tier, starts_at, expires_at, max_active_listings, max_featured_listings, is_active, created_at, updated_at' as const

/**
 * Active subscription row for a user (at most one per partial unique index).
 */
export async function getActiveSubscriptionForUser(
	userId: string,
): Promise<{ data: SubscriptionRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('subscriptions')
		.select(subscriptionColumns)
		.eq('user_id', userId)
		.eq('is_active', true)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('subscriptions:getActiveSubscriptionForUser', { userId }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function getSubscriptionById(
	id: string,
): Promise<{ data: SubscriptionRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('subscriptions')
		.select(subscriptionColumns)
		.eq('id', id)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('subscriptions:getSubscriptionById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

/**
 * Sets all active rows for this user to inactive (before activating a new tier).
 */
export async function deactivateActiveSubscriptionsForUser(
	userId: string,
): Promise<{ error: unknown }> {
	const { error } = await getAdmin()
		.from('subscriptions')
		.update({ is_active: false, updated_at: new Date().toISOString() })
		.eq('user_id', userId)
		.eq('is_active', true)

	if (error) {
		logDatabaseError('subscriptions:deactivateActiveSubscriptionsForUser', { userId }, error)
	}
	return { error }
}

export async function insertSubscription(
	row: SubscriptionInsert,
): Promise<{ data: SubscriptionRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('subscriptions')
		.insert(row)
		.select(subscriptionColumns)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('subscriptions:insertSubscription', { user_id: row.user_id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function updateSubscriptionById(
	id: string,
	patch: SubscriptionUpdate,
): Promise<{ data: SubscriptionRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('subscriptions')
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq('id', id)
		.select(subscriptionColumns)
		.maybeSingle()

	if (error && !isNotFoundError(error)) {
		logDatabaseError('subscriptions:updateSubscriptionById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

/**
 * Counts active + pending_review listings for quota display (mirrors DB trigger logic).
 */
export async function countListingsTowardQuota(userId: string): Promise<{ data: number; error: unknown }> {
	const { count, error } = await getAdmin()
		.from('listings')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', userId)
		.in('status', ['active', 'pending_review'])
		.is('deleted_at', null)

	if (error) {
		logDatabaseError('subscriptions:countListingsTowardQuota', { userId }, error)
		return { data: 0, error }
	}
	return { data: count ?? 0, error: null }
}
