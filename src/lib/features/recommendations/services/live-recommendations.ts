// ============================================================================
// Recommendations Feature — Live Recommendations Service
// ============================================================================
//
// The hot path: one call per behaviour change.
//
//   1. Pool     — the active catalogue (card columns + 1 cover image), cached
//                 in memory for POOL_TTL_MS so most decisions skip the DB.
//   2. Filter   — in stock, not already seen, not on screen, inside a hard
//                 budget when the shopper set a price filter.
//   3. Score    — pure scorer over every remaining part.
//   4. Diversify — no duplicate titles and at most MAX_PER_PART_TYPE of the
//                 same part type, so the rail never shows 4 identical cards
//                 (the catalogue has many same-title listings from different
//                 sellers).
//
// No LLM here by design: this runs on every click and must answer fast.

import "server-only";

import type { ListingRecord } from "@/lib/features/listings";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { CANDIDATE_POOL, DEFAULT_RECOMMENDATION_LIMIT } from "../config";
import { isColdProfile, resolveListingPartType, resolveListingVehicle } from "../profile";
import type { LiveRecommendationsResult, RecommendedListing, TasteProfile } from "../types";
import { listRecommendationPool } from "./_data-access/list-recommendation-pool";
import { pickStrategy, scoreLiveCandidate, type CandidateScore } from "./_scoring";

const POOL_TTL_MS = 60_000;
const MAX_PER_PART_TYPE = 2;

type PoolEntry = { listing: ListingRecord; vehicle: string | null; partType: string | null };

let poolCache: { at: number; entries: PoolEntry[] } | null = null;
let poolInFlight: Promise<{ data: PoolEntry[] | null; error: unknown }> | null = null;

type GetLiveRecommendationsInput = {
	profile: TasteProfile;
	contextListingId?: string | null;
	limit?: number;
};

// -- Pool cache -------------------------------------------------------------------

/**
 * Cached pool (stale-while-revalidate). Fresh → served from memory. Stale →
 * still served from memory while one background refresh runs. Empty (first
 * request after boot) → waits for the query. Concurrent misses share it.
 */
async function getPool(): Promise<{ data: PoolEntry[] | null; error: unknown }> {
	if (poolCache && Date.now() - poolCache.at < POOL_TTL_MS) return { data: poolCache.entries, error: null };
	if (poolCache) {
		refreshPool().catch((error) => console.error("[recommendations] background pool refresh failed", error));
		return { data: poolCache.entries, error: null };
	}
	return refreshPool();
}

/** Starts (or joins) a pool refresh. */
function refreshPool(): Promise<{ data: PoolEntry[] | null; error: unknown }> {
	if (poolInFlight) return poolInFlight;

	poolInFlight = (async () => {
		const { data, error } = await listRecommendationPool(createAdminSupabaseClient(), CANDIDATE_POOL);
		if (error || !data) return { data: null, error };

		// Resolve vehicle / part type once per refresh, not once per decision
		const entries = data.map((listing) => ({
			listing,
			vehicle: resolveListingVehicle(listing),
			partType: resolveListingPartType(listing),
		}));
		poolCache = { at: Date.now(), entries };
		return { data: entries, error: null };
	})().finally(() => {
		poolInFlight = null;
	});

	return poolInFlight;
}

/** Test hook: drops the cached pool. */
export function resetRecommendationPoolCache() {
	poolCache = null;
	poolInFlight = null;
}

// -- Diversity --------------------------------------------------------------------

type Ranked = PoolEntry & { result: CandidateScore };

/** Top `limit` with no duplicate titles and capped repeats per part type. */
function diversify(ranked: Ranked[], limit: number): Ranked[] {
	const picked: Ranked[] = [];
	const titles = new Set<string>();
	const perPart = new Map<string, number>();

	for (const item of ranked) {
		if (picked.length >= limit) break;
		const title = item.listing.title.trim().toLowerCase();
		const partKey = item.partType ?? "-";
		if (titles.has(title) || (perPart.get(partKey) ?? 0) >= MAX_PER_PART_TYPE) continue;

		picked.push(item);
		titles.add(title);
		perPart.set(partKey, (perPart.get(partKey) ?? 0) + 1);
	}

	// Tiny catalogues: top up with the best remaining unique titles
	for (const item of ranked) {
		if (picked.length >= limit) break;
		const title = item.listing.title.trim().toLowerCase();
		if (!titles.has(title)) {
			picked.push(item);
			titles.add(title);
		}
	}
	return picked;
}

// -- Service ----------------------------------------------------------------------

/**
 * Ranks live recommendations for a browser-computed taste profile.
 *
 * Cold profiles get the newest parts tagged "Trending now".
 */
export async function getLiveRecommendations({
	profile,
	contextListingId = null,
	limit = DEFAULT_RECOMMENDATION_LIMIT,
}: GetLiveRecommendationsInput): Promise<{ data: LiveRecommendationsResult | null; error: unknown }> {
	const startedAt = performance.now();

	// 1. Pool (cached)
	const pool = await getPool();
	if (pool.error || !pool.data) {
		console.error("[recommendations:getLiveRecommendations] pool failed", { contextListingId, error: pool.error });
		return { data: null, error: pool.error ?? new Error("Empty pool") };
	}

	// 2. Filter — hard budget only when it came from an explicit filter
	const excluded = new Set(contextListingId ? [...profile.viewedIds, contextListingId] : profile.viewedIds);
	const hard = profile.budget.source === "filter";
	const { min, max } = profile.budget;
	const candidates = pool.data.filter(({ listing }) => {
		const price = Number(listing.price);
		if (excluded.has(listing.id) || Number(listing.stock ?? 0) <= 0) return false;
		if (hard && min !== null && price < min) return false;
		if (hard && max !== null && price > max) return false;
		return true;
	});

	// 3. Score + rank (stable sort keeps newest-first ties)
	const cold = isColdProfile(profile);
	const ranked: Ranked[] = candidates
		.map((entry) => ({
			...entry,
			result: scoreLiveCandidate(profile, {
				id: entry.listing.id,
				vehicle: entry.vehicle,
				partType: entry.partType,
				price: Number(entry.listing.price),
				condition: entry.listing.listing_condition ?? null,
				created_at: entry.listing.created_at,
				stock: entry.listing.stock,
			}),
		}))
		.sort((a, b) => b.result.score - a.result.score);

	// 4. Diversify, then attach reasons
	const picked = diversify(ranked, limit);
	const listings: RecommendedListing[] = picked.map(({ listing, result }) => ({
		...listing,
		recommendation: {
			score: result.score,
			reasons: cold || result.reasons.length === 0 ? ["Trending now"] : result.reasons,
		},
	}));

	return {
		data: {
			strategy: pickStrategy(
				picked.map(({ result }) => result),
				cold,
			),
			listings,
			decisionMs: Math.round(performance.now() - startedAt),
		},
		error: null,
	};
}
