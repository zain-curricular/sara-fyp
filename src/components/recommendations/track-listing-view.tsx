// ============================================================================
// TrackListingView
// ============================================================================
//
// Invisible client island on the part detail page. Records a "view"
// behaviour event (vehicle, part type, price, condition) the moment the page
// mounts, which instantly re-ranks every live recommendation rail and updates
// the taste panel. Works for guests — the event lives in localStorage,
// separate from the signed-in `listing_views` row written by RecordListingView.

"use client";

import { useEffect } from "react";

import { recordBehaviourEvent, type ListingSignal } from "@/lib/features/recommendations";

/** Records one view event per listing mount. */
export function TrackListingView({ signal }: { signal: ListingSignal }) {
	const { listingId, title, vehicle, partType, price, condition } = signal;

	useEffect(() => {
		recordBehaviourEvent({ type: "view", listingId, title, vehicle, partType, price, condition });
	}, [listingId, title, vehicle, partType, price, condition]);

	return null;
}
