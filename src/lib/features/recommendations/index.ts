// ============================================================================
// Recommendations Feature — Client Barrel
// ============================================================================
//
// Live, behaviour-driven spare-part recommendations. Safe to import anywhere
// (no server code). Server-side scoring and AI explanation live behind
// `./services`.

export type {
	BehaviourEvent,
	ListingSignal,
	LiveRecommendationsResult,
	RecommendationStrategy,
	RecommendedListing,
	TasteBudget,
	TasteExplanation,
	TasteProfile,
	WeightedPreference,
} from "./types";

export type { LiveRecommendationsRequest, TasteExplanationRequest, TasteProfileInput } from "./schemas";
export { liveRecommendationsRequestSchema, tasteExplanationRequestSchema, tasteProfileSchema } from "./schemas";

export { CONDITION_LABELS } from "./config";

export {
	buildTasteProfile,
	canonicalPartType,
	canonicalVehicle,
	detectPartType,
	detectVehicle,
	formatPriceShort,
	isColdProfile,
	profileIntentKey,
	resolveListingPartType,
	resolveListingVehicle,
} from "./profile";

export type { BehaviourEventInput } from "./store";
export { clearBehaviourEvents, recordBehaviourEvent } from "./store";

export type { EngineDecision } from "./hooks";
export {
	useBehaviourEvents,
	useLastDecision,
	useLiveRecommendations,
	useTasteExplanation,
	useTasteProfile,
} from "./hooks";
