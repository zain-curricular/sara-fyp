import { ApiError } from "@/lib/api/client";

import type { FetchOrderDetailForReviewResult } from "../types";

/**
 * Maps GET /api/orders/[id] HTTP failures to RSC outcomes. Other statuses rethrow.
 */
export function mapApiErrorToOrderDetailReviewResult(
	e: ApiError,
): Extract<FetchOrderDetailForReviewResult, { ok: false }> | "rethrow" {
	if (e.status === 401) return { ok: false, reason: "no_session" };
	if (e.status === 404) return { ok: false, reason: "not_found" };
	if (e.status === 403) return { ok: false, reason: "forbidden" };
	return "rethrow";
}
