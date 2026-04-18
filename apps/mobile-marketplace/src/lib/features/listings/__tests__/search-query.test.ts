import { describe, expect, it } from "vitest";

import { toListingsApiQuery } from "@/lib/features/listings/search-query";

describe("toListingsApiQuery", () => {
	it("defaults platform to mobile", () => {
		expect(toListingsApiQuery({})).toBe("?platform=mobile");
	});

	it("includes filters and page when > 1", () => {
		const q = toListingsApiQuery({
			q: "iphone",
			city: "NYC",
			page: 2,
		});
		expect(q).toContain("platform=mobile");
		expect(q).toContain("q=iphone");
		expect(q).toContain("city=NYC");
		expect(q).toContain("page=2");
	});

	it("omits page when absent or 1", () => {
		expect(toListingsApiQuery({ page: 1 })).not.toContain("page=");
		expect(toListingsApiQuery({})).not.toContain("page=");
	});

	it("serializes numeric bounds", () => {
		const q = toListingsApiQuery({ price_min: 100, price_max: 500 });
		expect(q).toContain("price_min=100");
		expect(q).toContain("price_max=500");
	});
});
