// ============================================================================
// Client IP — for rate limiting and request attribution
// ============================================================================

/**
 * Best-effort client IP from proxy headers (Vercel, nginx, etc.).
 */
export function getClientIpFromRequest(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for')
	if (forwarded) {
		return forwarded.split(',')[0].trim()
	}
	return request.headers.get('x-real-ip') ?? 'unknown'
}
