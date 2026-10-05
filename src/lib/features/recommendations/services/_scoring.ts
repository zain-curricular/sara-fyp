// ============================================================================
// Recommendations Feature — Live Scorer (pure)
// ============================================================================
//
// Deterministic, explainable scoring of one candidate part against a taste
// profile. No I/O — unit-tested in isolation and called once per active
// listing per decision.
//
// Score contract (SCORE_WEIGHTS)
// ------------------------------
//   vehicle    10 × vehicle share     ("Toyota Corolla")
//   partType    6 × part-type share   ("Same part you viewed")
//   budget      4 × closeness to target, linear to 0 at ±40%
//                                     ("Under Rs 2k" / "In your price range")
//   condition 1.5 × condition share   ("OEM", share ≥ 0.5)
//   fresh      +0.5 if listed in the last 7 days
//   inStock    +0.3 when 5+ units are in stock
//
// Strategy = whichever signal contributed most across the returned set.

import { CONDITION_LABELS, SCORE_WEIGHTS, VEHICLE_REASON_THRESHOLD } from "../config";
import { formatPriceShort } from "../profile";
import type { RecommendationStrategy, TasteProfile, WeightedPreference } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;
const BUDGET_FALLOFF = 0.4;
const STOCK_BONUS_MIN = 5;

/** Candidate fields the scorer needs. `vehicle` / `partType` are resolved by the caller. */
export type ScoringCandidate = {
	id: string;
	vehicle: string | null;
	partType: string | null;
	price: number;
	condition: string | null;
	created_at: string | null;
	stock?: number | null;
};

export type CandidateScore = {
	score: number;
	reasons: string[];
	/** Per-signal contributions, used to pick the overall strategy. */
	parts: { vehicle: number; partType: number; budget: number };
};

function shareOf(list: WeightedPreference[], key: string | null): number {
	if (!key) return 0;
	const lowered = key.toLowerCase();
	return list.find((item) => item.key.toLowerCase() === lowered)?.share ?? 0;
}

function budgetReason(profile: TasteProfile): string {
	const { min, max, source } = profile.budget;
	if (source === "filter") {
		if (min !== null && max !== null) return `${formatPriceShort(min)}–${formatPriceShort(max)}`;
		if (max !== null) return `Under ${formatPriceShort(max)}`;
		if (min !== null) return `Over ${formatPriceShort(min)}`;
	}
	return "In your price range";
}

/**
 * Scores one candidate. Higher is better; 0 means no signal matched.
 *
 * @param now - Injected clock for deterministic tests.
 */
export function scoreLiveCandidate(
	profile: TasteProfile,
	candidate: ScoringCandidate,
	now: number = Date.now(),
): CandidateScore {
	const reasons: string[] = [];

	// Vehicle affinity — the dominant, most visible signal
	const vehicleShare = shareOf(profile.vehicles, candidate.vehicle);
	const vehicle = SCORE_WEIGHTS.vehicle * vehicleShare;
	if (candidate.vehicle && vehicleShare >= VEHICLE_REASON_THRESHOLD) reasons.push(candidate.vehicle);

	// Same kind of part as something viewed
	const partShare = shareOf(profile.partTypes, candidate.partType);
	const partType = SCORE_WEIGHTS.partType * partShare;
	if (partShare > 0) reasons.push("Same part you viewed");

	// Budget closeness — peaks at the target price
	let budget = 0;
	const price = Number(candidate.price);
	const { target, min, max } = profile.budget;
	if (target !== null && target > 0 && price > 0) {
		const distance = Math.abs(price - target) / target;
		budget = SCORE_WEIGHTS.budget * Math.max(0, 1 - distance / BUDGET_FALLOFF);
		const inRange = (min === null || price >= min) && (max === null || price <= max);
		if (inRange) reasons.push(budgetReason(profile));
	}

	// Condition preference (OEM / aftermarket / used / refurbished)
	const conditionShare = shareOf(profile.conditions, candidate.condition);
	const condition = SCORE_WEIGHTS.condition * conditionShare;
	if (candidate.condition && conditionShare >= 0.5)
		reasons.push(CONDITION_LABELS[candidate.condition] ?? candidate.condition);

	// Freshness + healthy stock as tie-breakers
	const createdAt = candidate.created_at ? new Date(candidate.created_at).getTime() : 0;
	const fresh = createdAt > 0 && now - createdAt < 7 * DAY_MS ? SCORE_WEIGHTS.fresh : 0;
	const inStock = Number(candidate.stock ?? 0) >= STOCK_BONUS_MIN ? SCORE_WEIGHTS.inStock : 0;

	const score = Math.round((vehicle + partType + budget + condition + fresh + inStock) * 100) / 100;
	return { score, reasons: reasons.slice(0, 3), parts: { vehicle, partType, budget } };
}

/** Names the signal that drove the returned set the most. */
export function pickStrategy(scores: CandidateScore[], cold: boolean): RecommendationStrategy {
	if (cold || scores.length === 0) return "cold-start";

	const totals = scores.reduce(
		(acc, { parts }) => ({
			vehicle: acc.vehicle + parts.vehicle,
			partType: acc.partType + parts.partType,
			budget: acc.budget + parts.budget,
		}),
		{ vehicle: 0, partType: 0, budget: 0 },
	);
	const sum = totals.vehicle + totals.partType + totals.budget;
	if (sum === 0) return "cold-start";

	const [topKey, topValue] = (Object.entries(totals) as Array<[keyof typeof totals, number]>).sort(
		(a, b) => b[1] - a[1],
	)[0];
	if (topValue / sum < 0.5) return "blended";
	return topKey === "vehicle" ? "vehicle-led" : topKey === "partType" ? "part-led" : "budget-led";
}
