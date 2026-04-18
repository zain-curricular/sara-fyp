/** Query string for GET /api/profiles/[id]/reviews */
export function profileReviewsQuery(page: number, limit: number): string {
	const sp = new URLSearchParams();
	sp.set("page", String(page));
	sp.set("limit", String(limit));
	return `?${sp.toString()}`;
}

/** 1-based next page for “load more” (matches API offset/limit pagination). */
export function profileReviewsNextPage(offset: number, limit: number): number {
	if (limit <= 0) return 1;
	return offset / limit + 2;
}
