// ============================================================================
// API tests — POST /api/recommendations/explanation
// ============================================================================
//
// Exercises the public taste-explanation route handler end to end: real IP
// extraction (`getRequestClientIp`), real Zod validation
// (`tasteExplanationRequestSchema`), real response envelope.
//
// Mock Boundary
// -------------
// The route needs no auth. Two modules reach outside the app and are mocked:
//   - `explainTaste` (services barrel) — calls an LLM
//   - `checkRecommendationsExplanationRateLimit` — calls Upstash Redis
// Every test defaults the limiter to "allowed" unless it is testing the 429.

import { randomUUID } from "node:crypto";

import { beforeEach, describe, it, expect, vi } from "vitest";

vi.mock("@/lib/features/recommendations/services", () => ({
	explainTaste: vi.fn(),
}));

vi.mock("@/lib/ratelimit/recommendations-explanation-ratelimit", () => ({
	checkRecommendationsExplanationRateLimit: vi.fn(),
}));

import type { TasteExplanation, TasteProfile } from "@/lib/features/recommendations";
import { explainTaste } from "@/lib/features/recommendations/services";
import { checkRecommendationsExplanationRateLimit } from "@/lib/ratelimit/recommendations-explanation-ratelimit";

import { buildJsonRequest, buildRequest } from "../../../../../__tests__/api";
import { POST } from "./route";

const mockExplainTaste = vi.mocked(explainTaste);
const mockCheckRateLimit = vi.mocked(checkRecommendationsExplanationRateLimit);

// -- Fixtures -------------------------------------------------------------------

const PATH = "/api/recommendations/explanation";

/** A valid, warm taste profile — one dominant vehicle and a soft budget. */
function buildProfile(overrides: Partial<TasteProfile> = {}): TasteProfile {

	return {
		eventCount: 3,
		vehicles: [{ key: "Toyota Corolla", share: 1 }],
		partTypes: [{ key: "Brake Pads", share: 1 }],
		conditions: [],
		budget: { min: null, max: null, target: 4500, source: "views" },
		viewedIds: [randomUUID()],
		lastEventLabel: "Viewed Corolla brake pads",
		...overrides,
	};
}

/** POST with a JSON body and caller-supplied headers (e.g. `x-forwarded-for`). */
function buildJsonRequestWithHeaders(body: unknown, headers: Record<string, string>): Request {

	return buildRequest(PATH, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body),
	});
}

const EXPLANATION: TasteExplanation = {
	text: "You seem to be shopping for Toyota Corolla brake pads around Rs 4.5k.",
	source: "ai",
	model: "claude-haiku-4-5",
};

// -- POST /api/recommendations/explanation ----------------------------------------

describe("POST /api/recommendations/explanation", () => {

	beforeEach(() => {

		// -- Limiter allows by default; individual tests override for 429
		mockCheckRateLimit.mockResolvedValue({ allowed: true });
	});

	it("should return 200 with the explanation and a no-store cache header", async () => {

		// Arrange
		mockExplainTaste.mockResolvedValueOnce({ data: EXPLANATION, error: null });
		const profile = buildProfile();

		// Act
		const response = await POST(buildJsonRequest(PATH, { profile }));
		const body = await response.json();

		// Assert
		expect(response.status).toBe(200);
		expect(body.ok).toBe(true);
		expect(body.data).toEqual(EXPLANATION);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
		expect(mockExplainTaste).toHaveBeenCalledWith(profile);
	});

	it("should return 429 and skip the service when the rate limit is exceeded", async () => {

		// Arrange
		mockCheckRateLimit.mockResolvedValueOnce({ allowed: false });

		// Act
		const response = await POST(buildJsonRequest(PATH, { profile: buildProfile() }));
		const body = await response.json();

		// Assert
		expect(response.status).toBe(429);
		expect(body.ok).toBe(false);
		expect(body.error).toBe("Too many requests");
		expect(mockExplainTaste).not.toHaveBeenCalled();
	});

	it("should rate limit on the first x-forwarded-for entry", async () => {

		// Arrange
		mockExplainTaste.mockResolvedValueOnce({ data: EXPLANATION, error: null });

		// Act
		const response = await POST(
			buildJsonRequestWithHeaders(
				{ profile: buildProfile() },
				{ "x-forwarded-for": "203.0.113.7, 10.0.0.1, 10.0.0.2" },
			),
		);
		const body = await response.json();

		// Assert
		expect(response.status).toBe(200);
		expect(body.ok).toBe(true);
		expect(mockCheckRateLimit).toHaveBeenCalledWith("203.0.113.7");
	});

	it("should rate limit under 'unknown' when no client IP header is present", async () => {

		// Arrange
		mockExplainTaste.mockResolvedValueOnce({ data: EXPLANATION, error: null });

		// Act
		const response = await POST(buildJsonRequest(PATH, { profile: buildProfile() }));
		const body = await response.json();

		// Assert
		expect(response.status).toBe(200);
		expect(body.ok).toBe(true);
		expect(mockCheckRateLimit).toHaveBeenCalledWith("unknown");
	});

	it("should return 400 when the profile is invalid", async () => {

		// Act
		const response = await POST(
			buildJsonRequest(PATH, {
				profile: buildProfile({ vehicles: [{ key: "Toyota Corolla", share: 2 }] }),
			}),
		);
		const body = await response.json();

		// Assert
		expect(response.status).toBe(400);
		expect(body.ok).toBe(false);
		expect(body.error).toEqual(expect.any(String));
		expect(mockExplainTaste).not.toHaveBeenCalled();
	});

	it("should return 400 when the body is malformed JSON", async () => {

		// Act
		const response = await POST(buildRequest(PATH, { method: "POST", body: "{not json" }));
		const body = await response.json();

		// Assert
		expect(response.status).toBe(400);
		expect(body.ok).toBe(false);
		expect(mockExplainTaste).not.toHaveBeenCalled();
	});

	it("should return 500 when the service throws", async () => {

		// Arrange
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		mockExplainTaste.mockRejectedValueOnce(new Error("boom"));

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
