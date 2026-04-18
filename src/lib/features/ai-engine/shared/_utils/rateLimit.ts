// ============================================================================
// AI Engine — per-user, per-feature limits (Upstash or in-memory fallback)
// ============================================================================

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

import { AI_RATE_LIMITS, type AiFeatureKey } from '../config'
import { AiError } from '../_errors/aiErrors'

let redisClient: Redis | null = null
const upstashLimiters = new Map<AiFeatureKey, Ratelimit>()

const inMemoryHits = new Map<string, number[]>()

function getRedis(): Redis | null {
	const url = process.env.UPSTASH_REDIS_REST_URL
	const token = process.env.UPSTASH_REDIS_REST_TOKEN
	if (!url || !token) {
		return null
	}
	if (!redisClient) {
		redisClient = new Redis({ url, token })
	}
	return redisClient
}

function windowMs(window: '1d' | '1h'): number {
	return window === '1d' ? 86_400_000 : 3_600_000
}

function upstashWindowToken(window: '1d' | '1h'): '1 d' | '1 h' {
	return window === '1d' ? '1 d' : '1 h'
}

function getUpstashLimiter(feature: AiFeatureKey): Ratelimit | null {
	const redis = getRedis()
	if (!redis) {
		return null
	}
	let lim = upstashLimiters.get(feature)
	if (!lim) {
		const cfg = AI_RATE_LIMITS[feature]
		lim = new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(cfg.requests, upstashWindowToken(cfg.window)),
			prefix: `ratelimit:ai:${feature}`,
		})
		upstashLimiters.set(feature, lim)
	}
	return lim
}

function pruneAndCount(key: string, window: number, now: number): number {
	const start = now - window
	const prev = inMemoryHits.get(key) ?? []
	const next = prev.filter((t) => t > start)
	inMemoryHits.set(key, next)
	return next.length
}

function recordInMemory(key: string, window: number, now: number, max: number): boolean {
	const count = pruneAndCount(key, window, now)
	if (count >= max) {
		return false
	}
	const next = inMemoryHits.get(key) ?? []
	next.push(now)
	inMemoryHits.set(key, next)
	return true
}

/**
 * Enforces per-user / per-feature budget. Throws `AiError` `RATE_LIMIT` when exhausted.
 */
export async function assertAiRateLimit(userId: string, feature: AiFeatureKey): Promise<void> {
	const cfg = AI_RATE_LIMITS[feature]
	const identifier = `${userId}:${feature}`
	const limiter = getUpstashLimiter(feature)

	if (limiter) {
		const { success } = await limiter.limit(identifier)
		if (!success) {
			throw new AiError('RATE_LIMIT')
		}
		return
	}

	const w = windowMs(cfg.window)
	const now = Date.now()
	if (!recordInMemory(`ai:${identifier}`, w, now, cfg.requests)) {
		throw new AiError('RATE_LIMIT')
	}
}

/** @internal Vitest — clear in-memory AI rate limit state */
export function _clearAiInMemoryRateLimitForTests(): void {
	inMemoryHits.clear()
}
