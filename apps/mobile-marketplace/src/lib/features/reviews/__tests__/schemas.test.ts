import { describe, expect, it } from "vitest";

import { postReviewSchema } from "@/lib/features/reviews/schemas";

describe("postReviewSchema", () => {
	it("accepts minimal valid payload", () => {
		const r = postReviewSchema.safeParse({
			order_id: "550e8400-e29b-41d4-a716-446655440000",
			rating: 5,
			comment: null,
		});
		expect(r.success).toBe(true);
	});

	it("rejects rating out of range", () => {
		const r = postReviewSchema.safeParse({
			order_id: "550e8400-e29b-41d4-a716-446655440000",
			rating: 6,
		});
		expect(r.success).toBe(false);
	});

	it("rejects invalid order id", () => {
		const r = postReviewSchema.safeParse({
			order_id: "not-uuid",
			rating: 3,
		});
		expect(r.success).toBe(false);
	});
});
