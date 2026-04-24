/**
 * Root workspace Next app (`src/app/api/*`) — **not** this auto dev server unless you only run one app.
 *
 * - **Browser:** empty string → same-origin `/api/...` on the auto app; `app/api/[[...path]]` proxies to
 *   `NEXT_PUBLIC_API_URL` (see `src/app/api/[[...path]]/route.ts`).
 * - **Server (RSC):** direct URL to that upstream (one hop), same env.
 *
 * Set `NEXT_PUBLIC_API_URL` to the URL where **repo-root** `npm run dev` listens (e.g. `http://localhost:3000`).
 * If the auto app took port 3000, run the main app on **another port** and point this env there.
 */
export function upstreamMarketplaceApiOrigin(): string {
	const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
	if (raw) return raw.replace(/\/$/, "");
	if (process.env.NODE_ENV === "development") {
		return "http://localhost:3000";
	}
	return "";
}

export function getMarketplaceApiBaseUrl(): string {
	if (typeof window !== "undefined") {
		return "";
	}
	return upstreamMarketplaceApiOrigin();
}

/** Same as {@link getMarketplaceApiBaseUrl} but `null` when unset (after dev default), for optional server fetches. */
export function getMarketplaceApiOrigin(): string | null {
	const base = getMarketplaceApiBaseUrl();
	return base || null;
}
