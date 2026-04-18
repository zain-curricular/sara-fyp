// ============================================================================
// Rate limiting — Upstash Redis sliding window with in-memory fallback
// ============================================================================
//
// Prefer Upstash in production (distributed). When env is missing, uses a
// per-process sliding window so local dev / tests still get basic protection.

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

export type RateLimitResult =
	| { ok: true }
	| { ok: false; error: NextResponse }

const WINDOW_MS = 60_000
const MAX_PAYMENT_WEBHOOK_PER_WINDOW = 120
const MAX_LISTING_PUBLIC_READ_PER_WINDOW = 300

const inMemoryHits = new Map<string, number[]>()

function pruneAndCount(key: string, now: number): number {
	const start = now - WINDOW_MS
	const prev = inMemoryHits.get(key) ?? []
	const next = prev.filter((t) => t > start)
	inMemoryHits.set(key, next)
	return next.length
}

function recordInMemory(fullKey: string, now: number, max: number): boolean {
	const count = pruneAndCount(fullKey, now)
	if (count >= max) {
		return false
	}
	const next = inMemoryHits.get(fullKey) ?? []
	next.push(now)
	inMemoryHits.set(fullKey, next)
	return true
}

function tooManyRequests(): RateLimitResult {
	return {
		ok: false,
		error: NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 }),
	}
}

let redisClient: Redis | null = null
let paymentWebhookRatelimit: Ratelimit | null = null
let listingPublicReadRatelimit: Ratelimit | null = null

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

function getPaymentWebhookRatelimit(): Ratelimit | null {
	const redis = getRedis()
	if (!redis) {
		return null
	}
	if (!paymentWebhookRatelimit) {
		paymentWebhookRatelimit = new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(MAX_PAYMENT_WEBHOOK_PER_WINDOW, '1 m'),
			prefix: 'ratelimit:payment-webhook',
		})
	}
	return paymentWebhookRatelimit
}

function getListingPublicReadRatelimit(): Ratelimit | null {
	const redis = getRedis()
	if (!redis) {
		return null
	}
	if (!listingPublicReadRatelimit) {
		listingPublicReadRatelimit = new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(MAX_LISTING_PUBLIC_READ_PER_WINDOW, '1 m'),
			prefix: 'ratelimit:listing-public',
		})
	}
	return listingPublicReadRatelimit
}

/**
 * Distributed (Upstash) or in-memory sliding window per identifier (e.g. client IP).
 */
export async function checkPaymentWebhookRateLimit(identifier: string): Promise<RateLimitResult> {
	const limiter = getPaymentWebhookRatelimit()
	if (limiter) {
		const { success } = await limiter.limit(identifier)
		if (!success) {
			return tooManyRequests()
		}
		return { ok: true }
	}

	const now = Date.now()
	if (!recordInMemory(`payment-webhook:${identifier}`, now, MAX_PAYMENT_WEBHOOK_PER_WINDOW)) {
		return tooManyRequests()
	}
	return { ok: true }
}

/**
 * Unauthenticated listing/auction public reads (bid feed, auction detail).
 */
export async function checkListingPublicReadRateLimit(identifier: string): Promise<RateLimitResult> {
	const limiter = getListingPublicReadRatelimit()
	if (limiter) {
		const { success } = await limiter.limit(identifier)
		if (!success) {
			return tooManyRequests()
		}
		return { ok: true }
	}

	const now = Date.now()
	if (!recordInMemory(`listing-public:${identifier}`, now, MAX_LISTING_PUBLIC_READ_PER_WINDOW)) {
		return tooManyRequests()
	}
	return { ok: true }
}

export function isRateLimited(r: RateLimitResult): r is { ok: false; error: NextResponse } {
	return r.ok === false
}

/** @internal Vitest — clear in-memory counters */
export function _clearInMemoryRateLimitForTests(): void {
	inMemoryHits.clear()
}
