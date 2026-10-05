// ============================================================================
// Recommendations Feature — Request Schema Tests
// ============================================================================
//
// Pins that the request schemas accept the catalogue's seeded listing ids
// (e.g. c5000000-0000-0000-0000-00000000017e). Zod v4's `uuid()` rejects these
// because their version bits are zero; the schemas use `guid()` instead. A
// regression here silently breaks every rail after the first viewed part.

import { describe, expect, it } from "vitest";

import { liveRecommendationsRequestSchema } from "../schemas";

const SEEDED_ID = "c5000000-0000-0000-0000-00000000017e";

const profile = {
	eventCount: 1,
	vehicles: [{ key: "Toyota Corolla", share: 1 }],
	partTypes: [],
	conditions: [],
	budget: { min: null, max: null, target: null, source: null },
	viewedIds: [SEEDED_ID],
	lastEventLabel: null,
};

describe("liveRecommendationsRequestSchema", () => {

	it("accepts seeded catalogue ids in viewedIds and contextListingId", () => {
		const result = liveRecommendationsRequestSchema.safeParse({ profile, contextListingId: SEEDED_ID });
		expect(result.success).toBe(true);
	});

	it("still rejects ids that are not GUID-shaped", () => {
		const result = liveRecommendationsRequestSchema.safeParse({
			profile: { ...profile, viewedIds: ["not-an-id"] },
		});
		expect(result.success).toBe(false);
	});
});
