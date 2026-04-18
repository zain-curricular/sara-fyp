import type { ListingsSearchParams } from "@/lib/features/listings/schemas";

/** Serialize search params for the remote `/api/listings` query string. */
export function toListingsApiQuery(params: ListingsSearchParams): string {
	const sp = new URLSearchParams();
	sp.set("platform", params.platform ?? "mobile");
	if (params.q) sp.set("q", params.q);
	if (params.city) sp.set("city", params.city);
	if (params.category_id) sp.set("category_id", params.category_id);
	if (params.model_id) sp.set("model_id", params.model_id);
	if (params.price_min !== undefined) sp.set("price_min", String(params.price_min));
	if (params.price_max !== undefined) sp.set("price_max", String(params.price_max));
	if (params.page && params.page > 1) sp.set("page", String(params.page));
	if (params.limit && params.limit !== 20) sp.set("limit", String(params.limit));
	return `?${sp.toString()}`;
}
