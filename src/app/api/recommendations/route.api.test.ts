// ============================================================================
// API tests — POST /api/recommendations
// ============================================================================
//
// Exercises the public live-recommendations route handler end to end: real
// Zod validation (`liveRecommendationsRequestSchema`), real response envelope,
// mocked service layer.
//
// Mock Boundary
// -------------
// The route needs no auth. `getLiveRecommendations` is mocked at the services
// barrel because it scans the whole catalogue — these tests cover the HTTP
// contract (validation → delegate → status/envelope/headers), not ranking.

import { randomUUID } from "node:crypto";

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/features/recommendations/services", () => ({
	getLiveRecommendations: vi.fn(),
}));

import type { LiveRecommendationsResult, TasteProfile } from "@/lib/features/recommendations";
import { getLiveRecommendations } from "@/lib/features/recommendations/services";

import { buildJsonRequest, buildRequest } from "../../../../__tests__/api";
import { POST } from "./route";

const mockGetLiveRecommendations = vi.mocked(getLiveRecommendations);

// -- Fixtures -------------------------------------------------------------------

const PATH = "/api/recommendations";

/** A valid, warm taste profile — two vehicle signals and a soft budget. */
function buildProfile(overrides: Partial<TasteProfile> = {}): TasteProfile {

	return {
		eventCount: 3,
		vehicles: [
			{ key: "Toyota Corolla", share: 0.7 },
			{ key: "Honda Civic", share: 0.3 },
		],
		partTypes: [{ key: "Brake Pads", share: 1 }],
		conditions: [{ key: "oem", share: 1 }],
		budget: { min: null, max: null, target: 4500, source: "views" },
		viewedIds: [randomUUID(), randomUUID()],
		lastEventLabel: "Viewed Corolla brake pads",
		...overrides,
	};
}

const RESULT: LiveRecommendationsResult = {
	strategy: "vehicle-led",
	listings: [],
	decisionMs: 42,
};

// -- POST /api/recommendations ----------------------------------------------------

describe("POST /api/recommendations", () => {

	it("should return 200 with recommendations and a no-store cache header", async () => {

		// Arrange
		mockGetLiveRecommendations.mockResolvedValueOnce({ data: RESULT, error: null });

		// Act
		const response = await POST(buildJsonRequest(PATH, { profile: buildProfile() }));
		const body = await response.json();

		// Assert
		expect(response.status).toBe(200);
		expect(body.ok).toBe(true);
		expect(body.data).toEqual(RESULT);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});

	it("should pass the profile, context listing and limit through to the service", async () => {

		// Arrange
		mockGetLiveRecommendations.mockResolvedValueOnce({ data: RESULT, error: null });
		const profile = buildProfile();
		const contextListingId = randomUUID();

		// Act
		const response = await POST(buildJsonRequest(PATH, { profile, contextListingId, limit: 12 }));
		const body = await response.json();

		// Assert
		expect(response.status).toBe(200);
		expect(body.ok).toBe(true);
		expect(mockGetLiveRecommendations).toHaveBeenCalledWith({ profile, contextListingId, limit: 12 });
	});

	it("should accept a cold profile with no optional fields", async () => {

		// Arrange
		mockGetLiveRecommendations.mockResolvedValueOnce({
			data: { ...RESULT, strategy: "cold-start" },
			error: null,
		});
		const profile = buildProfile({
			eventCount: 0,
			vehicles: [],
			partTypes: [],
			conditions: [],
			budget: { min: null, max: null, target: null, source: null },
			viewedIds: [],
			lastEventLabel: null,
		});

		// Act
		const response = await POST(buildJsonRequest(PATH, { profile }));
		const body = await response.json();

		// Assert
		expect(response.status).toBe(200);
		expect(body.ok).toBe(true);
		expect(body.data.strategy).toBe("cold-start");
		expect(mockGetLiveRecommendations).toHaveBeenCalledWith({
			profile,
			contextListingId: undefined,
			limit: undefined,
		});
	});

	it("should return 400 when the profile is missing", async () => {

		// Act
		const response = await POST(buildJsonRequest(PATH, { limit: 4 }));
		const body = await response.json();

		// Assert
		expect(response.status).toBe(400);
		expect(body.ok).toBe(false);
		expect(body.error).toEqual(expect.any(String));
		expect(mockGetLiveRecommendations).not.toHaveBeenCalled();
	});

	it("should return 400 when the body is malformed JSON", async () => {

		// Act
		const response = await POST(buildRequest(PATH, { method: "POST", body: "{not json" }));
		const body = await response.json();

		// Assert
		expect(response.status).toBe(400);
		expect(body.ok).toBe(false);
		expect(mockGetLiveRecommendations).not.toHaveBeenCalled();
	});

	it("should return 400 when limit exceeds 12", async () => {

		// Act
		const response = await POST(buildJsonRequest(PATH, { profile: buildProfile(), limit: 13 }));
		const body = await response.json();

		// Assert
		expect(response.status).toBe(400);
		expect(body.ok).toBe(false);
		expect(mockGetLiveRecommendations).not.toHaveBeenCalled();
	});

	it("should return 400 when viewedIds contains a non-uuid", async () => {

		// Act
		const response = await POST(
			buildJsonRequest(PATH, { profile: buildProfile({ viewedIds: ["not-a-uuid"] }) }),
		);
		const body = await response.json();

		// Assert
		expect(response.status).toBe(400);
		expect(body.ok).toBe(false);
		expect(mockGetLiveRecommendations).not.toHaveBeenCalled();
	});

	it("should return 500 when the service returns an error", async () => {

		// Arrange
		mockGetLiveRecommendations.mockResolvedValueOnce({ data: null, error: new Error("db down") });

		// Act
		const response = await POST(buildJsonRequest(PATH, { profile: buildProfile() }));
		const body = await response.json();

		// Assert
		expect(response.status).toBe(500);
		expect(body.ok).toBe(false);
		expect(body.error).toBe("Failed to load recommendations");
	});

	it("should return 500 when the service throws", async () => {

		// Arrange
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		mockGetLiveRecommendations.mockRejectedValueOnce(new Error("boom"));

		// Act
		const response = await POST(buildJsonRequest(PATH, { profile: buildProfile() }));
		const body = await response.json();

		// Assert
		expect(response.status).toBe(500);
		expect(body.ok).toBe(false);
		expect(body.error).toBe("Internal server error");

		consoleSpy.mockRestore();
	});
});
