// ============================================================================
// Recommendations Feature — Hooks
// ============================================================================
//
// React bindings for the live engine:
//
//   useTasteProfile()          behaviour log → TasteProfile (0ms, in-browser)
//   useLiveRecommendations()   profile change → debounced POST /api/recommendations
//   useTasteExplanation()      intent shift / every Nth event → AI one-liner
//   useLastDecision()          latest strategy + timing, for the taste panel
//
// Every rail on screen shares the same profile, so a single click re-ranks
// the home rail, the detail-page rail and the panel in one frame.

"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { apiFetch } from "@/lib/api/client";

import { EXPLANATION_EVERY_N_EVENTS, RECOMMENDATION_DEBOUNCE_MS } from "./config";
import { buildTasteProfile, isColdProfile, profileIntentKey } from "./profile";
import { getBehaviourEvents, getServerBehaviourEvents, subscribeToBehaviourEvents } from "./store";
import type {
	BehaviourEvent,
	LiveRecommendationsResult,
	RecommendationStrategy,
	TasteExplanation,
	TasteProfile,
} from "./types";

// -- Profile ----------------------------------------------------------------------

/** Raw behaviour log; re-renders on every recorded event. */
export function useBehaviourEvents(): BehaviourEvent[] {
	return useSyncExternalStore(subscribeToBehaviourEvents, getBehaviourEvents, getServerBehaviourEvents);
}

/** Live taste profile derived from the behaviour log. */
export function useTasteProfile(): TasteProfile {
	const events = useBehaviourEvents();
	return useMemo(() => buildTasteProfile(events), [events]);
}

// -- Last decision (shared between rails and the taste panel) ---------------------------

export type EngineDecision = {
	strategy: RecommendationStrategy;
	decisionMs: number;
	roundTripMs: number;
	at: number;
};

let lastDecision: EngineDecision | null = null;
const decisionListeners = new Set<() => void>();

function publishDecision(decision: EngineDecision) {
	lastDecision = decision;
	for (const listener of decisionListeners) listener();
}

function subscribeToDecisions(listener: () => void) {
	decisionListeners.add(listener);
	return () => {
		decisionListeners.delete(listener);
	};
}

/** Most recent engine decision from any rail on the page. */
export function useLastDecision(): EngineDecision | null {
	return useSyncExternalStore(
		subscribeToDecisions,
		() => lastDecision,
		() => null,
	);
}

// -- Live recommendations ----------------------------------------------------------------

type UseLiveRecommendationsOptions = {
	contextListingId?: string | null;
	limit?: number;
};

type LiveRecommendationsState = {
	data: LiveRecommendationsResult | null;
	isLoading: boolean;
	error: string | null;
	profile: TasteProfile;
};

/**
 * Re-ranks recommendations whenever the taste profile changes.
 *
 * Requests are debounced and aborted on supersede, so rapid clicks only pay for
 * the last decision. Cold profiles still fetch (the API returns trending picks).
 */
export function useLiveRecommendations({
	contextListingId = null,
	limit,
}: UseLiveRecommendationsOptions = {}): LiveRecommendationsState {
	const profile = useTasteProfile();
	const [data, setData] = useState<LiveRecommendationsResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Body holds ranking inputs only, so label/count changes don't re-fetch
	const requestBody = useMemo(
		() =>
			JSON.stringify({
				profile: { ...profile, eventCount: 0, lastEventLabel: null },
				contextListingId,
				limit,
			}),
		[profile, contextListingId, limit],
	);

	useEffect(() => {

		// Debounce + abort so bursts of events collapse into one decision
		const controller = new AbortController();
		const timer = window.setTimeout(async () => {
			const startedAt = performance.now();
			setIsLoading(true);
			try {
				const response = await apiFetch<{ ok: true; data: LiveRecommendationsResult }>("/api/recommendations", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: requestBody,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;

				setData(response.data);
				setError(null);
				publishDecision({
					strategy: response.data.strategy,
					decisionMs: response.data.decisionMs,
					roundTripMs: Math.round(performance.now() - startedAt),
					at: Date.now(),
				});
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Failed to load recommendations");
			} finally {
				if (!controller.signal.aborted) setIsLoading(false);
			}
		}, RECOMMENDATION_DEBOUNCE_MS);

		return () => {
			controller.abort();
			window.clearTimeout(timer);
		};
	}, [requestBody]);

	return { data, isLoading, error, profile };
}

// -- AI explanation -------------------------------------------------------------------------

/** Counts view/favourite events — the cadence trigger for re-explaining. */
function listingEventCount(events: BehaviourEvent[]) {
	return events.filter((event) => event.type !== "filter").length;
}

/**
 * Fetches a one-line AI read of the shopper's intent.
 *
 * Trigger: the intent key changes (new top brand or budget) or every
 * EXPLANATION_EVERY_N_EVENTS listing events — never on every click, so the
 * slower model never sits on the hot path.
 */
export function useTasteExplanation(): { explanation: TasteExplanation | null; isLoading: boolean } {
	const events = useBehaviourEvents();
	const profile = useTasteProfile();
	const [explanation, setExplanation] = useState<TasteExplanation | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const cold = isColdProfile(profile);
	const cadenceBucket = Math.floor(listingEventCount(events) / EXPLANATION_EVERY_N_EVENTS);
	const triggerKey = cold ? null : `${profileIntentKey(profile)}#${cadenceBucket}`;

	// Latest profile for the request without making it an effect trigger
	const profileRef = useRef(profile);
	useEffect(() => {
		profileRef.current = profile;
	});

	useEffect(() => {
		if (triggerKey === null) return;

		const controller = new AbortController();
		const timer = window.setTimeout(async () => {
			setIsLoading(true);
			try {
				const response = await apiFetch<{ ok: true; data: TasteExplanation }>("/api/recommendations/explanation", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ profile: profileRef.current }),
					signal: controller.signal,
				});
				if (!controller.signal.aborted) setExplanation(response.data);
			} catch {
				// Explanation is decorative — keep the previous line on failure.
			} finally {
				if (!controller.signal.aborted) setIsLoading(false);
			}
		}, 400);

		return () => {
			controller.abort();
			window.clearTimeout(timer);
		};
	}, [triggerKey]);

	// A cold profile (e.g. after Reset) hides any stale explanation
	return { explanation: triggerKey === null ? null : explanation, isLoading };
}
