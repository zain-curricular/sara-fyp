import { describe, expect, it } from "vitest";

import { extractVariantsFromSpecs } from "@/lib/features/product-catalog";

describe("product-catalog utils", () => {
	it("returns explicit specs.variants when valid", () => {
		const variants = extractVariantsFromSpecs({
			variants: [
				{ key: "storage", value: "128GB" },
				{ key: "color", value: "black" },
			],
		});

		expect(variants).toEqual([
			{ key: "storage", value: "128GB" },
			{ key: "color", value: "black" },
		]);
	});

	it("falls back to arrays of string options", () => {
		const variants = extractVariantsFromSpecs({
			storage: ["128GB", "256GB"],
			color: ["black"],
		});

		expect(variants).toEqual([
			{ key: "storage", value: "128GB" },
			{ key: "storage", value: "256GB" },
			{ key: "color", value: "black" },
		]);
	});

	it("returns empty when no variants found", () => {
		expect(extractVariantsFromSpecs({ foo: "bar" })).toEqual([]);
	});
});

