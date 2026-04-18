import { describe, expect, it } from "vitest";

import { favoritesAndViewsQuery } from "@/lib/features/favorites/query";

describe("favoritesAndViewsQuery", () => {
	it("builds page and limit query string", () => {
		expect(favoritesAndViewsQuery(1, 24)).toBe("?page=1&limit=24");
		expect(favoritesAndViewsQuery(2, 20)).toBe("?page=2&limit=20");
	});
});
