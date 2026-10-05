// ============================================================================
// Recommendations Feature — Taste Profile Builder
// ============================================================================
//
// Pure functions that fold the browser's behaviour log into a TasteProfile.
// Runs on every event in the browser, so the taste panel updates with zero
// network latency; the same profile is then sent to the scoring API.
//
// Weighting
// ---------
// Events are walked newest → oldest. Each event's base weight (view 1,
// favourite 2.5, vehicle / part filter 2) is multiplied by RECENCY_DECAY^rank,
// so the latest 2–3 actions dominate: Civic×2 then Corolla×2 flips the top
// vehicle to Corolla (64%), and a third Corolla view pushes it to ~76%.
//
// Budget
// ------
// The most recent filter event is the shopper's current filter state. A price
// filter becomes a HARD range (the API excludes everything outside it). With
// no price filter, viewed prices define a SOFT ±25% band around their
// recency-weighted mean.

import {
	EVENT_WEIGHTS,
	PART_TYPE_KEYWORDS,
	PROFILE_LIMITS,
	RECENCY_DECAY,
	SOFT_BUDGET_BAND,
	VEHICLE_KEYWORDS,
} from "./config";
import type { BehaviourEvent, TasteBudget, TasteProfile, WeightedPreference } from "./types";

// -- Helpers ----------------------------------------------------------------------

/** Normalises a weight map into a top-N list of shares (of the full total). */
function toShares(weights: Map<string, number>, limit: number): WeightedPreference[] {
	const total = [...weights.values()].reduce((sum, w) => sum + w, 0);
	if (total <= 0) return [];

	return [...weights.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([key, weight]) => ({ key, share: Math.round((weight / total) * 1000) / 1000 }));
}

function addWeight(weights: Map<string, number>, key: string | null, weight: number) {
	if (!key) return;
	weights.set(key, (weights.get(key) ?? 0) + weight);
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Returns the first canonical key whose phrase appears in `text` on word boundaries. */
function detectKeyword(text: string | null | undefined, keywords: Record<string, string[]>): string | null {
	const haystack = ` ${text?.toLowerCase().replace(/[^a-z0-9-]+/g, " ") ?? ""} `;
	if (haystack.trim().length === 0) return null;

	for (const [canonical, phrases] of Object.entries(keywords)) {
		for (const phrase of phrases) {
			if (new RegExp(`(^|\\s)${escapeRegExp(phrase)}(\\s|$)`).test(haystack)) return canonical;
		}
	}
	return null;
}

/** Detects a vehicle in free text ("corolla brake pads" → "Toyota Corolla"). */
export function detectVehicle(text: string | null | undefined): string | null {
	return detectKeyword(text, VEHICLE_KEYWORDS);
}

/** Detects a part type in free text ("corolla brake pads" → "Brake Pads"). */
export function detectPartType(text: string | null | undefined): string | null {
	return detectKeyword(text, PART_TYPE_KEYWORDS);
}

/** Canonical vehicle name for a raw value ("toyota corolla" → "Toyota Corolla"). */
export function canonicalVehicle(raw: string | null | undefined): string | null {
	const value = raw?.trim().toLowerCase();
	if (!value) return null;

	for (const vehicle of Object.keys(VEHICLE_KEYWORDS)) {
		if (vehicle.toLowerCase() === value) return vehicle;
	}
	return detectVehicle(value);
}

/** Canonical part type for a raw value ("brake pads" → "Brake Pads"). */
export function canonicalPartType(raw: string | null | undefined): string | null {
	const value = raw?.trim().toLowerCase();
	if (!value) return null;

	for (const partType of Object.keys(PART_TYPE_KEYWORDS)) {
		if (partType.toLowerCase() === value) return partType;
	}
	return detectPartType(value);
}

function detailString(details: Record<string, unknown> | null | undefined, key: string): string | null {
	const value = details?.[key];
	return typeof value === "string" ? value : null;
}

type ListingLike = { title: string; details?: Record<string, unknown> | null };

/** Vehicle for a listing: `details.brand` when it names a vehicle, else detected from the title. */
export function resolveListingVehicle(listing: ListingLike): string | null {
	return canonicalVehicle(detailString(listing.details, "brand")) ?? detectVehicle(listing.title);
}

/** Part type for a listing: `details.part_type`, else detected from the title. */
export function resolveListingPartType(listing: ListingLike): string | null {
	return canonicalPartType(detailString(listing.details, "part_type")) ?? detectPartType(listing.title);
}

/** Short "Rs 2k" style price label. */
export function formatPriceShort(value: number): string {
	// Round first so 1999 reads "Rs 2k" (not "Rs 2.0k") and 999.6 reads "Rs 1k"
	const k = Math.round(value / 100) / 10;
	if (k >= 1) return `Rs ${k}k`;
	return `Rs ${Math.round(value)}`;
}

function describeEvent(event: BehaviourEvent): string {
	if (event.type === "view") return `Viewed ${event.title}`;
	if (event.type === "favorite") return `Saved ${event.title}`;

	const parts: string[] = [];
	if (event.query) parts.push(`"${event.query}"`);
	else {
		if (event.vehicle) parts.push(event.vehicle);
		if (event.partType) parts.push(event.partType);
	}
	if (event.priceMax !== null && event.priceMin !== null)
		parts.push(`${formatPriceShort(event.priceMin)}–${formatPriceShort(event.priceMax)}`);
	else if (event.priceMax !== null) parts.push(`under ${formatPriceShort(event.priceMax)}`);
	else if (event.priceMin !== null) parts.push(`over ${formatPriceShort(event.priceMin)}`);
	return parts.length > 0 ? `Searched ${parts.join(" · ")}` : "Cleared filters";
}

// -- Budget -----------------------------------------------------------------------

function buildBudget(newestFirst: BehaviourEvent[]): TasteBudget {

	// Recency-weighted mean of viewed / saved prices
	let weightedSum = 0;
	let weightTotal = 0;
	newestFirst.forEach((event, rank) => {
		if (event.type === "filter" || !(event.price > 0)) return;
		const weight = RECENCY_DECAY ** rank;
		weightedSum += event.price * weight;
		weightTotal += weight;
	});
	const viewedTarget = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : null;

	// Latest filter event = current filter state; a price filter is a hard range
	const latestFilter = newestFirst.find((event) => event.type === "filter");
	if (latestFilter?.type === "filter" && (latestFilter.priceMin !== null || latestFilter.priceMax !== null)) {
		const min = latestFilter.priceMin;
		const max = latestFilter.priceMax;
		const fallbackTarget = max !== null ? Math.round(max * 0.85) : Math.round((min ?? 0) * 1.15);
		const inRange =
			viewedTarget !== null && (min === null || viewedTarget >= min) && (max === null || viewedTarget <= max);
		return { min, max, target: inRange ? viewedTarget : fallbackTarget, source: "filter" };
	}

	if (viewedTarget === null) return { min: null, max: null, target: null, source: null };

	return {
		min: Math.floor(viewedTarget * (1 - SOFT_BUDGET_BAND)),
		max: Math.ceil(viewedTarget * (1 + SOFT_BUDGET_BAND)),
		target: viewedTarget,
		source: "views",
	};
}

// -- Profile ----------------------------------------------------------------------

/**
 * Folds a behaviour log (any order) into a bounded TasteProfile.
 *
 * @param events - Behaviour events; sorted internally newest-first.
 */
export function buildTasteProfile(events: BehaviourEvent[]): TasteProfile {
	const newestFirst = [...events].sort((a, b) => b.at - a.at);

	const vehicleWeights = new Map<string, number>();
	const partTypeWeights = new Map<string, number>();
	const conditionWeights = new Map<string, number>();
	const viewedIds: string[] = [];

	// Walk newest → oldest so recency decay favours the latest behaviour
	newestFirst.forEach((event, rank) => {
		const decay = RECENCY_DECAY ** rank;

		if (event.type === "filter") {
			const vehicle = canonicalVehicle(event.vehicle) ?? detectVehicle(event.query);
			const partType = canonicalPartType(event.partType) ?? detectPartType(event.query);
			addWeight(vehicleWeights, vehicle, EVENT_WEIGHTS.filterVehicle * decay);
			addWeight(partTypeWeights, partType, EVENT_WEIGHTS.filterPartType * decay);
			return;
		}

		const base = event.type === "favorite" ? EVENT_WEIGHTS.favorite : EVENT_WEIGHTS.view;
		addWeight(vehicleWeights, canonicalVehicle(event.vehicle), base * decay);
		addWeight(partTypeWeights, canonicalPartType(event.partType), base * decay);
		addWeight(conditionWeights, event.condition, base * decay);
		if (!viewedIds.includes(event.listingId)) viewedIds.push(event.listingId);
	});

	return {
		eventCount: events.length,
		vehicles: toShares(vehicleWeights, PROFILE_LIMITS.vehicles),
		partTypes: toShares(partTypeWeights, PROFILE_LIMITS.partTypes),
		conditions: toShares(conditionWeights, PROFILE_LIMITS.conditions),
		budget: buildBudget(newestFirst),
		viewedIds: viewedIds.slice(0, PROFILE_LIMITS.viewedIds),
		lastEventLabel: newestFirst[0] ? describeEvent(newestFirst[0]) : null,
	};
}

/** True when the profile carries no usable signal (cold start). */
export function isColdProfile(profile: TasteProfile): boolean {
	return profile.vehicles.length === 0 && profile.partTypes.length === 0 && profile.budget.source === null;
}

/**
 * Stable key for the parts of a profile that change the shopper's intent:
 * top vehicle and budget. Used to decide when to ask the explanation model
 * again. Part type is left out on purpose — it changes on almost every click,
 * and the every-3rd-view cadence already refreshes it. View budgets drift per
 * click, so they are bucketed by Rs 1,000 (parts are cheap; Rs 25k would never move).
 */
export function profileIntentKey(profile: TasteProfile): string {
	const topVehicle = profile.vehicles[0]?.key ?? "-";
	const { min, max, target, source } = profile.budget;

	const budget =
		source === "filter"
			? `filter:${min ?? "-"}-${max ?? "-"}`
			: source === "views" && target !== null
				? `views:${Math.round(target / 1_000)}`
				: "-";
	return `${topVehicle}|${budget}`;
}
