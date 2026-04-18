import { describe, expect, it } from "vitest";

import { profileReviewsNextPage, profileReviewsQuery } from "@/lib/features/reviews/query";

describe("profileReviewsQuery", () => {
	it("builds page and limit", () => {
		expect(profileReviewsQuery(1, 20)).toBe("?page=1&limit=20");
		expect(profileReviewsQuery(3, 10)).toBe("?page=3&limit=10");
	});
});

describe("profileReviewsNextPage", () => {
	it("returns page 2 from first page (offset 0)", () => {
		expect(profileReviewsNextPage(0, 20)).toBe(2);
	});

	it("returns page 3 when offset is 20 and limit 20", () => {
		expect(profileReviewsNextPage(20, 20)).toBe(3);
	});

	it("returns 1 when limit is invalid (guard)", () => {
		expect(profileReviewsNextPage(0, 0)).toBe(1);
	});
});
