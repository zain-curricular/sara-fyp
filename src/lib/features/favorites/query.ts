/** Query string for GET /api/favorites/me and GET /api/me/recent-views (same pagination shape). */
export function favoritesAndViewsQuery(page: number, limit: number): string {
	const sp = new URLSearchParams();
	sp.set("page", String(page));
	sp.set("limit", String(limit));
	return `?${sp.toString()}`;
}
