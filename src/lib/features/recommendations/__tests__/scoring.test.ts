// ============================================================================
// Unit tests — Recommendations Live Scorer
// ============================================================================
//
// Covers the deterministic per-candidate scorer and the strategy picker used
// by the live recommendations service. Pure functions only — the clock is
// injected (`NOW`) so freshness checks are deterministic.
//
// Score contract under test
// -------------------------
//   vehicle 10× share (reason at share ≥ 0.25) · partType 6× share
//   budget 4× closeness, 0 at ±40% · condition 1.5× (reason at share ≥ 0.5)
//   fresh +0.5 (< 7 days) · inStock +0.3 (stock ≥ 5) · max 3 reasons

import { describe, it, expect } from "vitest";

import { pickStrategy, scoreLiveCandidate, type CandidateScore, type ScoringCandidate } from "../services/_scoring";
import type { TasteProfile } from "../types";

// -- Builders -----------------------------------------------------------------------

const NOW = new Date("2026-10-06T12:00:00Z").getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

/** Empty (cold) profile — tests override only the signal they exercise. */
function makeProfile(overrides: Partial<TasteProfile> = {}): TasteProfile {
	return {
		eventCount: 0,
		vehicles: [],
		partTypes: [],
		conditions: [],
		budget: { min: null, max: null, target: null, source: null },
		viewedIds: [],
		lastEventLabel: null,
		...overrides,
	};
}

/** Candidate with no matching signal and no tie-breaker bonuses. */
function makeCandidate(overrides: Partial<ScoringCandidate> = {}): ScoringCandidate {
	return {
		id: crypto.randomUUID(),
		vehicle: null,
		partType: null,
		price: 1500,
		condition: null,
		created_at: null,
		stock: null,
		...overrides,
	};
}

function makeScore(parts: CandidateScore["parts"]): CandidateScore {
	return { score: parts.vehicle + parts.partType + parts.budget, reasons: [], parts };
}

// -- Vehicle ------------------------------------------------------------------------

describe("scoreLiveCandidate vehicle", () => {

	it("should score vehicle at 10× share and name the vehicle as a reason", () => {
		const profile = makeProfile({ vehicles: [{ key: "Toyota Corolla", share: 0.64 }] });

		const result = scoreLiveCandidate(profile, makeCandidate({ vehicle: "Toyota Corolla" }), NOW);

		expect(result.parts.vehicle).toBeCloseTo(6.4, 5);
		expect(result.reasons).toContain("Toyota Corolla");
	});

	it("should name the vehicle at exactly the 0.25 share threshold", () => {
		const profile = makeProfile({ vehicles: [{ key: "Toyota Corolla", share: 0.25 }] });

		const result = scoreLiveCandidate(profile, makeCandidate({ vehicle: "Toyota Corolla" }), NOW);

		expect(result.reasons).toContain("Toyota Corolla");
	});

	it("should score but not name the vehicle below the 0.25 share threshold", () => {
		const profile = makeProfile({ vehicles: [{ key: "Honda Civic", share: 0.2 }] });

		const result = scoreLiveCandidate(profile, makeCandidate({ vehicle: "Honda Civic" }), NOW);

		expect(result.parts.vehicle).toBeCloseTo(2, 5);
		expect(result.reasons).not.toContain("Honda Civic");
	});
});

// -- Part type ----------------------------------------------------------------------

describe("scoreLiveCandidate part type", () => {

	it("should score part type at 6× share with 'Same part you viewed'", () => {
		const profile = makeProfile({ partTypes: [{ key: "Brake Pads", share: 0.5 }] });

		const result = scoreLiveCandidate(profile, makeCandidate({ partType: "Brake Pads" }), NOW);

		expect(result.parts.partType).toBeCloseTo(3, 5);
		expect(result.reasons).toContain("Same part you viewed");
	});

	it("should give no part-type score or reason for an unviewed part", () => {
		const profile = makeProfile({ partTypes: [{ key: "Brake Pads", share: 0.5 }] });

		const result = scoreLiveCandidate(profile, makeCandidate({ partType: "Radiator" }), NOW);

		expect(result.parts.partType).toBe(0);
		expect(result.reasons).not.toContain("Same part you viewed");
	});
});

// -- Budget -------------------------------------------------------------------------

describe("scoreLiveCandidate budget", () => {

	const viewsProfile = makeProfile({ budget: { min: null, max: null, target: 2000, source: "views" } });

	it("should score the full 4 at the target price", () => {
		const result = scoreLiveCandidate(viewsProfile, makeCandidate({ price: 2000 }), NOW);

		expect(result.parts.budget).toBeCloseTo(4, 5);
	});

	it("should score 2 at 20% away from the target", () => {
		const above = scoreLiveCandidate(viewsProfile, makeCandidate({ price: 2400 }), NOW);
		const below = scoreLiveCandidate(viewsProfile, makeCandidate({ price: 1600 }), NOW);

		expect(above.parts.budget).toBeCloseTo(2, 5);
		expect(below.parts.budget).toBeCloseTo(2, 5);
	});

	it("should score 0 at 40% or more away from the target", () => {
		const atFalloff = scoreLiveCandidate(viewsProfile, makeCandidate({ price: 2800 }), NOW);
		const beyond = scoreLiveCandidate(viewsProfile, makeCandidate({ price: 5000 }), NOW);

		expect(atFalloff.parts.budget).toBeCloseTo(0, 5);
		expect(beyond.parts.budget).toBe(0);
	});

	it("should give 'Under Rs 2k' for a max-only price filter", () => {
		const profile = makeProfile({ budget: { min: null, max: 2000, target: 1700, source: "filter" } });

		const result = scoreLiveCandidate(profile, makeCandidate({ price: 1500 }), NOW);

		expect(result.reasons).toContain("Under Rs 2k");
	});

	it("should give 'Rs 1k–Rs 2k' for a min + max price filter", () => {
		const profile = makeProfile({ budget: { min: 1000, max: 2000, target: 1700, source: "filter" } });

		const result = scoreLiveCandidate(profile, makeCandidate({ price: 1500 }), NOW);

		expect(result.reasons).toContain("Rs 1k–Rs 2k");
	});

	it("should give 'In your price range' for a soft views budget", () => {
		const profile = makeProfile({ budget: { min: 1253, max: 2089, target: 1671, source: "views" } });

		const result = scoreLiveCandidate(profile, makeCandidate({ price: 1700 }), NOW);

		expect(result.reasons).toContain("In your price range");
	});

	it("should omit the budget reason when the price is outside the range", () => {
		const profile = makeProfile({ budget: { min: 1253, max: 2089, target: 1671, source: "views" } });

		const result = scoreLiveCandidate(profile, makeCandidate({ price: 2200 }), NOW);

		expect(result.reasons).not.toContain("In your price range");
	});
});

// -- Condition ----------------------------------------------------------------------

describe("scoreLiveCandidate condition", () => {

	it("should label an OEM condition at share ≥ 0.5", () => {
		const profile = makeProfile({ conditions: [{ key: "oem", share: 0.5 }] });

		const result = scoreLiveCandidate(profile, makeCandidate({ condition: "oem" }), NOW);

		expect(result.reasons).toContain("OEM");
		expect(result.score).toBeCloseTo(0.75, 2);
	});

	it("should label a refurbished condition at share ≥ 0.5", () => {
		const profile = makeProfile({ conditions: [{ key: "refurbished", share: 0.6 }] });

		const result = scoreLiveCandidate(profile, makeCandidate({ condition: "refurbished" }), NOW);

		expect(result.reasons).toContain("Refurbished");
	});

	it("should not label the condition below 0.5 share", () => {
		const profile = makeProfile({ conditions: [{ key: "oem", share: 0.4 }] });

		const result = scoreLiveCandidate(profile, makeCandidate({ condition: "oem" }), NOW);

		expect(result.reasons).not.toContain("OEM");
	});
});

// -- Tie-breakers -------------------------------------------------------------------

describe("scoreLiveCandidate tie-breakers", () => {

	it("should add 0.5 for a listing created within 7 days", () => {
		const created_at = new Date(NOW - 6 * DAY_MS).toISOString();

		const result = scoreLiveCandidate(makeProfile(), makeCandidate({ created_at }), NOW);

		expect(result.score).toBe(0.5);
	});

	it("should add nothing for a listing created 8 days ago", () => {
		const created_at = new Date(NOW - 8 * DAY_MS).toISOString();

		const result = scoreLiveCandidate(makeProfile(), makeCandidate({ created_at }), NOW);

		expect(result.score).toBe(0);
	});

	it("should add 0.3 when stock is 5 or more", () => {
		const result = scoreLiveCandidate(makeProfile(), makeCandidate({ stock: 5 }), NOW);

		expect(result.score).toBe(0.3);
	});

	it("should add nothing when stock is below 5 or unknown", () => {
		const low = scoreLiveCandidate(makeProfile(), makeCandidate({ stock: 4 }), NOW);
		const unknown = scoreLiveCandidate(makeProfile(), makeCandidate({ stock: null }), NOW);

		expect(low.score).toBe(0);
		expect(unknown.score).toBe(0);
	});
});

// -- Reasons + ranking --------------------------------------------------------------

describe("scoreLiveCandidate reasons and ranking", () => {

	it("should cap reasons at 3, keeping the strongest signals first", () => {
		const profile = makeProfile({
			vehicles: [{ key: "Toyota Corolla", share: 0.64 }],
			partTypes: [{ key: "Brake Pads", share: 0.5 }],
			conditions: [{ key: "oem", share: 0.6 }],
			budget: { min: 1253, max: 2089, target: 1671, source: "views" },
		});
		const candidate = makeCandidate({
			vehicle: "Toyota Corolla",
			partType: "Brake Pads",
			condition: "oem",
			price: 1700,
		});

		const result = scoreLiveCandidate(profile, candidate, NOW);

		expect(result.reasons).toEqual(["Toyota Corolla", "Same part you viewed", "In your price range"]);
	});

	it("should rank a Corolla part above a Civic part at the same price for a Corolla-heavy profile", () => {
		const profile = makeProfile({
			vehicles: [
				{ key: "Toyota Corolla", share: 0.76 },
				{ key: "Honda Civic", share: 0.24 },
			],
			partTypes: [{ key: "Brake Pads", share: 1 }],
			budget: { min: 1253, max: 2089, target: 1671, source: "views" },
		});

		const corolla = scoreLiveCandidate(
			profile,
			makeCandidate({ vehicle: "Toyota Corolla", partType: "Brake Pads", price: 1600 }),
			NOW,
		);
		const civic = scoreLiveCandidate(
			profile,
			makeCandidate({ vehicle: "Honda Civic", partType: "Brake Pads", price: 1600 }),
			NOW,
		);

		expect(corolla.score).toBeGreaterThan(civic.score);
	});
});

// -- pickStrategy -------------------------------------------------------------------

describe("pickStrategy", () => {

	it("should return cold-start for a cold profile", () => {
		const scores = [makeScore({ vehicle: 6, partType: 0, budget: 0 })];

		expect(pickStrategy(scores, true)).toBe("cold-start");
	});

	it("should return cold-start when no scores or no signal contributed", () => {
		expect(pickStrategy([], false)).toBe("cold-start");
		expect(pickStrategy([makeScore({ vehicle: 0, partType: 0, budget: 0 })], false)).toBe("cold-start");
	});

	it("should return vehicle-led when vehicle contributes at least half", () => {
		const scores = [makeScore({ vehicle: 6, partType: 2, budget: 1 }), makeScore({ vehicle: 4, partType: 1, budget: 1 })];

		expect(pickStrategy(scores, false)).toBe("vehicle-led");
	});

	it("should return part-led when part type contributes at least half", () => {
		const scores = [makeScore({ vehicle: 1, partType: 6, budget: 1 })];

		expect(pickStrategy(scores, false)).toBe("part-led");
	});

	it("should return budget-led when budget contributes at least half", () => {
		const scores = [makeScore({ vehicle: 0, partType: 1, budget: 4 })];

		expect(pickStrategy(scores, false)).toBe("budget-led");
	});

	it("should return blended when no signal reaches half", () => {
		const scores = [makeScore({ vehicle: 4, partType: 3, budget: 3 })];

		expect(pickStrategy(scores, false)).toBe("blended");
	});
});
