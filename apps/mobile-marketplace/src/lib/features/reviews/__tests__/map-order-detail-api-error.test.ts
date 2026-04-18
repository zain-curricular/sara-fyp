import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/client";

import { mapApiErrorToOrderDetailReviewResult } from "@/lib/features/reviews/map-order-detail-api-error";

describe("mapApiErrorToOrderDetailReviewResult", () => {
	it("maps 401 to no_session", () => {
		expect(mapApiErrorToOrderDetailReviewResult(new ApiError("Unauthorized", 401))).toEqual({
			ok: false,
			reason: "no_session",
		});
	});

	it("maps 404 to not_found", () => {
		expect(mapApiErrorToOrderDetailReviewResult(new ApiError("Not found", 404))).toEqual({
			ok: false,
			reason: "not_found",
		});
	});

	it("maps 403 to forbidden", () => {
		expect(mapApiErrorToOrderDetailReviewResult(new ApiError("Forbidden", 403))).toEqual({
			ok: false,
			reason: "forbidden",
		});
	});

	it("returns rethrow for other statuses", () => {
		expect(mapApiErrorToOrderDetailReviewResult(new ApiError("Server error", 500))).toBe("rethrow");
	});
});
