import { describe, expect, it } from "vitest";

import { catalogUuidParamSchema } from "@/lib/features/product-catalog/schemas";

describe("catalogUuidParamSchema", () => {
	it("accepts valid UUIDs", () => {
		const id = "550e8400-e29b-41d4-a716-446655440000";
		expect(catalogUuidParamSchema.safeParse(id).success).toBe(true);
	});

	it("rejects invalid ids", () => {
		expect(catalogUuidParamSchema.safeParse("not-a-uuid").success).toBe(false);
	});
});
