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
const MAX_PER_WINDOW = 120

const inMemoryHits = new Map<string, number[]>()

function pruneAndCount(key: string, now: number): number {
	const start = now - WINDOW_MS
	const prev = inMemoryHits.get(key) ?? []
	const next = prev.filter((t) => t > start)
	inMemoryHits.set(key, next)
	return next.length
}

function recordInMemory(key: string, now: number): boolean {
	const count = pruneAndCount(key, now)
	if (count >= MAX_PER_WINDOW) {
		return false
	}
	const next = inMemoryHits.get(key) ?? []
	next.push(now)
	inMemoryHits.set(key, next)
	return true
}

let redisClient: Redis | null = null
let paymentWebhookRatelimit: Ratelimit | null = null

function getPaymentWebhookRatelimit(): Ratelimit | null {
	const url = process.env.UPSTASH_REDIS_REST_URL
	const token = process.env.UPSTASH_REDIS_REST_TOKEN
	if (!url || !token) {
		return null
	}
	if (!redisClient) {
		redisClient = new Redis({ url, token })
	}
	if (!paymentWebhookRatelimit) {
		paymentWebhookRatelimit = new Ratelimit({
			redis: redisClient,
			limiter: Ratelimit.slidingWindow(120, '1 m'),
			prefix: 'ratelimit:payment-webhook',
		})
	}
	return paymentWebhookRatelimit
}

/**
 * Distributed (Upstash) or in-memory sliding window per identifier (e.g. client IP).
 */
export async function checkPaymentWebhookRateLimit(identifier: string): Promise<RateLimitResult> {
	const limiter = getPaymentWebhookRatelimit()
	if (limiter) {
		const { success } = await limiter.limit(identifier)
		if (!success) {
			return {
				ok: false,
				error: NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 }),
			}
		}
		return { ok: true }
	}

	const now = Date.now()
	if (!recordInMemory(`payment-webhook:${identifier}`, now)) {
		return {
			ok: false,
			error: NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 }),
		}
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
