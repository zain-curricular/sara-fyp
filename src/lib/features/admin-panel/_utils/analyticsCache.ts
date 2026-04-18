// ============================================================================
// Admin Panel — 60s in-memory memo for analytics endpoints
// ============================================================================

import { ADMIN_ANALYTICS_CACHE_MAX_ENTRIES, ADMIN_ANALYTICS_CACHE_TTL_MS } from '../config'

const store = new Map<string, { expiresAt: number; payload: unknown }>()

export function getAdminAnalyticsCache<T>(key: string): T | null {
	const row = store.get(key)
	if (!row) return null
	if (Date.now() > row.expiresAt) {
		store.delete(key)
		return null
	}
	return row.payload as T
}

export function setAdminAnalyticsCache(key: string, payload: unknown): void {
	store.set(key, { expiresAt: Date.now() + ADMIN_ANALYTICS_CACHE_TTL_MS, payload })
	while (store.size > ADMIN_ANALYTICS_CACHE_MAX_ENTRIES) {
		const first = store.keys().next().value as string | undefined
		if (first) store.delete(first)
		else break
	}
}

/** @internal Vitest */
export function _clearAdminAnalyticsCacheForTests(): void {
	store.clear()
}
