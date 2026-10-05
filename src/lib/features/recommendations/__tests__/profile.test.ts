// ============================================================================
// Unit tests — Recommendations Taste Profile Builder
// ============================================================================
//
// Covers the pure, in-browser fold of the behaviour log into a TasteProfile:
// recency-decayed vehicle / part-type shares, keyword detection, listing
// signal resolution, hard vs soft budgets, list caps, the intent key that
// gates explanation refreshes, and the short price / last-event labels.
//
// No DB, no network — data in, data out.
//
// Recency maths (RECENCY_DECAY = 0.75)
// ------------------------------------
//   newest ×1, then ×0.75, ×0.5625, ×0.4219 …
//   Civic×2 → Corolla×2  ⇒  Corolla 1.75 / 2.734 ≈ 0.64
//   + one more Corolla    ⇒  Corolla 2.3125 / 3.051 ≈ 0.76

import { describe, it, expect } from "vitest";

import {
	buildTasteProfile,
	canonicalVehicle,
	detectPartType,
	detectVehicle,
	formatPriceShort,
	isColdProfile,
	profileIntentKey,
	resolveListingPartType,
	resolveListingVehicle,
} from "../profile";
import type { BehaviourEvent } from "../types";

// -- Builders -----------------------------------------------------------------------

type ViewEvent = Extract<BehaviourEvent, { type: "view" }>;
type FavoriteEvent = Extract<BehaviourEvent, { type: "favorite" }>;
type FilterEvent = Extract<BehaviourEvent, { type: "filter" }>;

function makeView(overrides: Partial<ViewEvent> = {}): ViewEvent {
	return {
		type: "view",
		at: 1,
		listingId: crypto.randomUUID(),
		title: "Toyota Corolla Brake Pads",
		vehicle: "Toyota Corolla",
		partType: "Brake Pads",
		price: 1500,
		condition: "oem",
		...overrides,
	};
}

function makeFavorite(overrides: Partial<FavoriteEvent> = {}): FavoriteEvent {
	return { ...makeView(), ...overrides, type: "favorite" };
}

function makeFilter(overrides: Partial<FilterEvent> = {}): FilterEvent {
	return {
		type: "filter",
		at: 1,
		vehicle: null,
		partType: null,
		priceMin: null,
		priceMax: null,
		query: null,
		...overrides,
	};
}

function shareOf(list: { key: string; share: number }[], key: string): number | undefined {
	return list.find((item) => item.key === key)?.share;
}

// -- buildTasteProfile ----------------------------------------------------------------

describe("buildTasteProfile", () => {

	it("should return a cold profile for an empty behaviour log", () => {
		const profile = buildTasteProfile([]);

		expect(isColdProfile(profile)).toBe(true);
		expect(profile.budget.source).toBeNull();
		expect(profile.lastEventLabel).toBeNull();
	});

	it("should flip the top vehicle to Corolla (~64%) after 2 Civic then 2 Corolla views", () => {
		const events = [
			makeView({ at: 1, vehicle: "Honda Civic" }),
			makeView({ at: 2, vehicle: "Honda Civic" }),
			makeView({ at: 3, vehicle: "Toyota Corolla" }),
			makeView({ at: 4, vehicle: "Toyota Corolla" }),
		];

		const profile = buildTasteProfile(events);

		expect(profile.vehicles[0].key).toBe("Toyota Corolla");
		expect(profile.vehicles[0].share).toBeCloseTo(0.64, 2);
	});

	it("should push Corolla to ~76% after a third Corolla view", () => {
		const events = [
			makeView({ at: 1, vehicle: "Honda Civic" }),
			makeView({ at: 2, vehicle: "Honda Civic" }),
			makeView({ at: 3, vehicle: "Toyota Corolla" }),
			makeView({ at: 4, vehicle: "Toyota Corolla" }),
			makeView({ at: 5, vehicle: "Toyota Corolla" }),
		];

		const profile = buildTasteProfile(events);

		expect(profile.vehicles[0].key).toBe("Toyota Corolla");
		expect(profile.vehicles[0].share).toBeCloseTo(0.76, 2);
	});

	it("should sort events by time regardless of input order", () => {
		const events = [
			makeView({ at: 4, vehicle: "Toyota Corolla" }),
			makeView({ at: 1, vehicle: "Honda Civic" }),
			makeView({ at: 3, vehicle: "Toyota Corolla" }),
			makeView({ at: 2, vehicle: "Honda Civic" }),
		];

		const profile = buildTasteProfile(events);

		expect(profile.vehicles[0].key).toBe("Toyota Corolla");
		expect(profile.vehicles[0].share).toBeCloseTo(0.64, 2);
	});

	it("should weigh a favourite 2.5× a view", () => {
		// Civic view newest (×1); Corolla favourite one step older (2.5 × 0.75 = 1.875)
		const events = [
			makeFavorite({ at: 1, vehicle: "Toyota Corolla" }),
			makeView({ at: 2, vehicle: "Honda Civic" }),
		];

		const profile = buildTasteProfile(events);

		expect(shareOf(profile.vehicles, "Toyota Corolla")).toBeCloseTo(1.875 / 2.875, 2);
		expect(shareOf(profile.vehicles, "Honda Civic")).toBeCloseTo(1 / 2.875, 2);
	});

	it("should add weight 2 to both the vehicle and part type detected in a search query", () => {
		// Older Civic oil-filter view (×0.75) vs newest "corolla brake pads" search (2 × 1)
		const events = [
			makeView({ at: 1, vehicle: "Honda Civic", partType: "Oil Filter" }),
			makeFilter({ at: 2, query: "corolla brake pads" }),
		];

		const profile = buildTasteProfile(events);

		expect(shareOf(profile.vehicles, "Toyota Corolla")).toBeCloseTo(2 / 2.75, 2);
		expect(shareOf(profile.partTypes, "Brake Pads")).toBeCloseTo(2 / 2.75, 2);
	});

	it("should dedupe viewed ids newest first", () => {
		const events = [
			makeView({ at: 1, listingId: "a" }),
			makeView({ at: 2, listingId: "b" }),
			makeView({ at: 3, listingId: "a" }),
		];

		const profile = buildTasteProfile(events);

		expect(profile.viewedIds).toEqual(["a", "b"]);
	});

	it("should cap viewed ids at 30, keeping the newest", () => {
		const events = Array.from({ length: 35 }, (_, i) => makeView({ at: i, listingId: `id-${i}` }));

		const profile = buildTasteProfile(events);

		expect(profile.viewedIds).toHaveLength(30);
		expect(profile.viewedIds[0]).toBe("id-34");
		expect(profile.viewedIds).not.toContain("id-4");
	});

	it("should cap vehicles at 5", () => {
		const vehicles = [
			"Suzuki Mehran",
			"Suzuki Alto",
			"Suzuki Cultus",
			"Toyota Corolla",
			"Honda Civic",
			"Honda City",
			"KIA Sportage",
		];
		const events = vehicles.map((vehicle, i) => makeView({ at: i, vehicle }));

		const profile = buildTasteProfile(events);

		expect(profile.vehicles).toHaveLength(5);
	});
});

// -- Budget -------------------------------------------------------------------------

describe("buildTasteProfile budget", () => {

	it("should use a price filter as a hard range targeting the viewed mean when it is inside", () => {
		// Viewed mean (filter holds rank 0): (1800×0.75 + 1500×0.5625) / 1.3125 ≈ 1671
		const events = [
			makeView({ at: 1, price: 1500 }),
			makeView({ at: 2, price: 1800 }),
			makeFilter({ at: 3, priceMax: 2000 }),
		];

		const profile = buildTasteProfile(events);

		expect(profile.budget).toEqual({ min: null, max: 2000, target: 1671, source: "filter" });
	});

	it("should target 85% of the filter max when the viewed mean is outside the range", () => {
		const events = [makeView({ at: 1, price: 3000 }), makeFilter({ at: 2, priceMax: 2000 })];

		const profile = buildTasteProfile(events);

		expect(profile.budget).toEqual({ min: null, max: 2000, target: 1700, source: "filter" });
	});

	it("should release the hard range when a later filter clears the price", () => {
		// Viewed mean is still ≈ 1671 → soft band floor(×0.75)=1253, ceil(×1.25)=2089
		const events = [
			makeView({ at: 1, price: 1500 }),
			makeView({ at: 2, price: 1800 }),
			makeFilter({ at: 3, priceMax: 2000 }),
			makeFilter({ at: 4 }),
		];

		const profile = buildTasteProfile(events);

		expect(profile.budget).toEqual({ min: 1253, max: 2089, target: 1671, source: "views" });
	});
});

// -- Keyword detection --------------------------------------------------------------

describe("detectVehicle", () => {

	it("should detect a multi-word vehicle keyword", () => {
		expect(detectVehicle("wagon r oil filter")).toBe("Suzuki Wagon R");
	});

	it("should detect a hyphenated vehicle keyword", () => {
		expect(detectVehicle("br-v radiator")).toBe("Honda BR-V");
	});

	it("should not treat plain 'city' as Honda City", () => {
		expect(detectVehicle("city")).toBeNull();
	});

	it("should detect Honda City when the make is present", () => {
		expect(detectVehicle("honda city")).toBe("Honda City");
	});
});

describe("detectPartType", () => {

	it("should detect the part type from a listing title with punctuation", () => {
		expect(detectPartType("Suzuki Alto Brake Disc Rotors — Front Pair")).toBe("Brake Disc");
	});
});

describe("canonicalVehicle", () => {

	it("should map a lowercase vehicle name to its canonical form", () => {
		expect(canonicalVehicle("toyota corolla")).toBe("Toyota Corolla");
	});

	it("should return null for a brand that is not a vehicle", () => {
		expect(canonicalVehicle("DBA")).toBeNull();
	});
});

// -- Listing resolution -------------------------------------------------------------

describe("resolveListingVehicle", () => {

	it("should prefer details.brand over the title", () => {
		const listing = { title: "Honda Civic Brake Pads", details: { brand: "Toyota Corolla" } };

		expect(resolveListingVehicle(listing)).toBe("Toyota Corolla");
	});

	it("should fall back to the title when details are missing", () => {
		const listing = { title: "Suzuki Mehran Brake Pads — Front (Set of 4)", details: null };

		expect(resolveListingVehicle(listing)).toBe("Suzuki Mehran");
	});

	it("should fall back to the title when details.brand is not a vehicle", () => {
		const listing = { title: "Suzuki Mehran Brake Pads — Front (Set of 4)", details: { brand: "DBA" } };

		expect(resolveListingVehicle(listing)).toBe("Suzuki Mehran");
	});
});

describe("resolveListingPartType", () => {

	it("should prefer details.part_type over the title", () => {
		const listing = { title: "Suzuki Mehran Brake Pads", details: { part_type: "Oil Filter" } };

		expect(resolveListingPartType(listing)).toBe("Oil Filter");
	});

	it("should fall back to the title when details.part_type is missing", () => {
		const listing = { title: "Suzuki Mehran Brake Pads — Front (Set of 4)", details: { brand: "DBA" } };

		expect(resolveListingPartType(listing)).toBe("Brake Pads");
	});
});

// -- Intent key ---------------------------------------------------------------------

describe("profileIntentKey", () => {

	it("should change when the top vehicle changes", () => {
		const civic = [
			makeView({ at: 1, vehicle: "Honda Civic", price: 1200 }),
			makeView({ at: 2, vehicle: "Honda Civic", price: 1200 }),
		];
		const flipped = [
			...civic,
			makeView({ at: 3, vehicle: "Toyota Corolla", price: 1200 }),
			makeView({ at: 4, vehicle: "Toyota Corolla", price: 1200 }),
		];

		const before = profileIntentKey(buildTasteProfile(civic));
		const after = profileIntentKey(buildTasteProfile(flipped));

		expect(after).not.toBe(before);
	});

	it("should change when a price filter is applied or changed", () => {
		const base = [makeView({ at: 1, price: 1200 })];
		const under2k = [...base, makeFilter({ at: 2, priceMax: 2000 })];
		const under3k = [...under2k, makeFilter({ at: 3, priceMax: 3000 })];

		const keys = [base, under2k, under3k].map((events) => profileIntentKey(buildTasteProfile(events)));

		expect(new Set(keys).size).toBe(3);
	});

	it("should not change for a same-vehicle view of a different part in the same Rs 1,000 bucket", () => {
		// Targets: 1200 → (1300 + 1200×0.75) / 1.75 ≈ 1257 — both round to bucket 1
		const before = [makeView({ at: 1, vehicle: "Toyota Corolla", partType: "Brake Pads", price: 1200 })];
		const after = [
			...before,
			makeView({ at: 2, vehicle: "Toyota Corolla", partType: "Oil Filter", price: 1300 }),
		];

		const beforeKey = profileIntentKey(buildTasteProfile(before));
		const afterKey = profileIntentKey(buildTasteProfile(after));

		expect(afterKey).toBe(beforeKey);
	});
});

// -- Labels -------------------------------------------------------------------------

describe("formatPriceShort", () => {

	it("should format whole thousands without a decimal", () => {
		expect(formatPriceShort(2000)).toBe("Rs 2k");
	});

	it("should format fractional thousands with one decimal", () => {
		expect(formatPriceShort(1500)).toBe("Rs 1.5k");
	});

	it("should format sub-thousand prices as plain rupees", () => {
		expect(formatPriceShort(750)).toBe("Rs 750");
	});
});

describe("buildTasteProfile lastEventLabel", () => {

	it("should describe a max-price filter as 'Searched under Rs 2k'", () => {
		const profile = buildTasteProfile([makeFilter({ priceMax: 2000, query: null })]);

		expect(profile.lastEventLabel).toBe("Searched under Rs 2k");
	});

	it("should quote the search query for a text search", () => {
		const profile = buildTasteProfile([makeFilter({ query: "corolla" })]);

		expect(profile.lastEventLabel).toBe('Searched "corolla"');
	});
});
