// ============================================================================
// Recommendations — in-memory TTL cache for GET /recommendations/for-me
// ============================================================================

import type { ListingRow } from '@/lib/supabase/database.types'

import { FOR_ME_CACHE_MAX_ENTRIES, FOR_ME_CACHE_TTL_MS } from '../config'

const cache = new Map<string, { expiresAt: number; listings: ListingRow[] }>()

export function cacheKeyForMe(userId: string, platform: string): string {
	return `${userId}:${platform}`
}

export function getForMeFromCache(key: string): ListingRow[] | null {
	const row = cache.get(key)
	if (!row) return null
	if (Date.now() > row.expiresAt) {
		cache.delete(key)
		return null
	}
	return row.listings
}

export function setForMeCache(key: string, listings: ListingRow[]): void {
	cache.set(key, { expiresAt: Date.now() + FOR_ME_CACHE_TTL_MS, listings })
	while (cache.size > FOR_ME_CACHE_MAX_ENTRIES) {
		const first = cache.keys().next().value as string | undefined
		if (first) cache.delete(first)
		else break
	}
}

/** Vitest only — clears cache between tests. */
export function _clearForMeCacheForTests(): void {
	cache.clear()
}
