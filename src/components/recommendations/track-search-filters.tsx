// ============================================================================
// TrackSearchFilters
// ============================================================================
//
// Invisible client island on the search page. Each time the applied filters
// change (price range, free-text query) it records a "filter" behaviour event.
// The query is mined for a vehicle and part type ("corolla brake pads"), and a
// price filter becomes a hard budget, so "under Rs 2,000" instantly limits
// every recommendation to that range; clearing the filter releases it.

"use client";

import { useEffect } from "react";

import { recordBehaviourEvent } from "@/lib/features/recommendations";

type TrackSearchFiltersProps = {
	priceMin?: number | null;
	priceMax?: number | null;
	query?: string | null;
};

/** Records the current filter state as a behaviour event. */
export function TrackSearchFilters({ priceMin, priceMax, query }: TrackSearchFiltersProps) {

	// Vehicle / part type are detected from the free-text query by the profile builder
	const normalized = {
		vehicle: null,
		partType: null,
		priceMin: priceMin ?? null,
		priceMax: priceMax ?? null,
		query: query?.trim() || null,
	};
	const key = JSON.stringify(normalized);

	useEffect(() => {

		// An empty filter state is recorded too — it releases a previous hard budget
		recordBehaviourEvent({ type: "filter", ...(JSON.parse(key) as typeof normalized) });
	}, [key]);

	return null;
}
