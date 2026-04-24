/**
 * Returns the base URL for same-app API calls.
 * Browser: empty string (same-origin /api/...).
 * Server (RSC): http://localhost:3000 so fetch has an absolute URL.
 */
export function getMarketplaceApiBaseUrl(): string {
	if (typeof window !== "undefined") return "";
	return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export function getMarketplaceApiOrigin(): string | null {
	const base = getMarketplaceApiBaseUrl();
	return base || null;
}
