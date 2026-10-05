// ============================================================================
// Request IP
// ============================================================================
//
// Derives the caller's IP from standard proxy headers (Vercel, nginx). Used as
// the rate-limit identifier for public, unauthenticated endpoints.

import "server-only";

/** First client IP from `x-forwarded-for`, else `x-real-ip`, else null. */
export function getRequestClientIp(request: Request): string | null {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		const first = forwarded.split(",")[0]?.trim();
		if (first) return first;
	}
	const real = request.headers.get("x-real-ip");
	if (real?.trim()) return real.trim();
	return null;
}
