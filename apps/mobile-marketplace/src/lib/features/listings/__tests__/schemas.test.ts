import { describe, expect, it } from "vitest";

import { listingsSearchParamsSchema } from "@/lib/features/listings/schemas";

describe("listingsSearchParamsSchema", () => {
	it("parses minimal mobile search", () => {
		const r = listingsSearchParamsSchema.safeParse({ platform: "mobile" });
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.platform).toBe("mobile");
	});

	it("rejects invalid uuid for model_id", () => {
		const r = listingsSearchParamsSchema.safeParse({
			platform: "mobile",
			model_id: "not-uuid",
		});
		expect(r.success).toBe(false);
	});
});
