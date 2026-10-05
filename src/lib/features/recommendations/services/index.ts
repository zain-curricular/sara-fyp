// ============================================================================
// Recommendations Feature — Server Barrel
// ============================================================================
//
// Server-only entry points for the live recommendation engine. Import from
// `@/lib/features/recommendations/services` in API routes and RSCs only.

import "server-only";

export { getLiveRecommendations } from "./live-recommendations";
export { buildRulesExplanation, explainTaste } from "./taste-explanation";
export { pickStrategy, scoreLiveCandidate } from "./_scoring";
export type { CandidateScore, ScoringCandidate } from "./_scoring";
