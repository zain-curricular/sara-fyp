// ============================================================================
// Recommendations Explanation — Rate Limit
// ============================================================================
//
// Per-IP guard for POST /api/recommendations/explanation, which calls an LLM
// on every request.
//
// Behaviour
// ---------
// Upstash sliding window, 30 requests / minute / IP. Fails open: when the
// Upstash env vars are unset (local dev) or Redis errors, every request is
// allowed so infrastructure trouble never blocks shoppers.

import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _limiter: Ratelimit | null | undefined;

/** Lazily builds the limiter once; `null` when Upstash is not configured. */
function getExplanationLimiter(): Ratelimit | null {

	if (_limiter !== undefined) return _limiter;

	// -- No Upstash config → disable limiting
	const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
	const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
	if (!url || !token) {
		_limiter = null;
		return null;
	}

	const redis = new Redis({ url, token });
	_limiter = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(30, "1 m"),
		analytics: false,
		prefix: "ratelimit:recs_explanation",
	});
	return _limiter;
}

/**
 * 30 explanation requests / minute / IP. When Upstash is unset or Redis
 * errors, allows all.
 */
export async function checkRecommendationsExplanationRateLimit(
	clientIp: string,
): Promise<{ allowed: true } | { allowed: false }> {

	const limiter = getExplanationLimiter();
	if (!limiter) {
		return { allowed: true };
	}

	// -- Fail open on Redis errors
	try {
		const { success } = await limiter.limit(
			`recs_explanation:${clientIp.replace(/:/g, "_").slice(0, 200)}`,
		);
		if (success) return { allowed: true };
	} catch (e) {
		console.error("recommendations explanation rate limit", e);
		return { allowed: true };
	}

	return { allowed: false };
}
