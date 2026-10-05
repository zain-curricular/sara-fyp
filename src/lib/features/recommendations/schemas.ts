// ============================================================================
// Recommendations Feature — Zod Schemas
// ============================================================================
//
// Request bodies for POST /api/recommendations and
// POST /api/recommendations/explanation. The taste profile is computed in the
// browser, so it is untrusted input: every list is bounded, every number is
// clamped, and every string is length-capped before it reaches the scorer or
// the explanation prompt.

import { z } from "zod";

import { PROFILE_LIMITS } from "./config";

const price = z.number().finite().min(0).max(10_000_000);

// `guid()`, not `uuid()`: Zod v4's uuid() enforces RFC version bits, and the
// seeded catalogue uses ids like c5000000-0000-0000-0000-00000000017e.
const listingId = z.guid();

const weightedPreference = z.object({
	key: z.string().trim().min(1).max(80),
	share: z.number().min(0).max(1),
});

/** Browser-computed taste profile (see `buildTasteProfile`). */
export const tasteProfileSchema = z.object({
	eventCount: z.number().int().min(0).max(1000),
	vehicles: z.array(weightedPreference).max(PROFILE_LIMITS.vehicles),
	partTypes: z.array(weightedPreference).max(PROFILE_LIMITS.partTypes),
	conditions: z.array(weightedPreference).max(PROFILE_LIMITS.conditions),
	budget: z.object({
		min: price.nullable(),
		max: price.nullable(),
		target: price.nullable(),
		source: z.enum(["filter", "views"]).nullable(),
	}),
	viewedIds: z.array(listingId).max(PROFILE_LIMITS.viewedIds),
	lastEventLabel: z.string().max(200).nullable(),
});

/** Body for POST /api/recommendations. */
export const liveRecommendationsRequestSchema = z.object({
	profile: tasteProfileSchema,
	/** Listing currently on screen (detail page) — excluded from results. */
	contextListingId: listingId.nullable().optional(),
	limit: z.number().int().min(1).max(12).optional(),
});

/** Body for POST /api/recommendations/explanation. */
export const tasteExplanationRequestSchema = z.object({
	profile: tasteProfileSchema,
});

export type TasteProfileInput = z.infer<typeof tasteProfileSchema>;
export type LiveRecommendationsRequest = z.infer<typeof liveRecommendationsRequestSchema>;
export type TasteExplanationRequest = z.infer<typeof tasteExplanationRequestSchema>;
