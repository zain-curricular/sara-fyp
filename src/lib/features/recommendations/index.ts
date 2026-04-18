// ============================================================================
// Recommendations — client-safe barrel (schemas + config constants)
// ============================================================================

export {
	similarListingsQuerySchema,
	trendingQuerySchema,
	forMeQuerySchema,
	type SimilarListingsQuery,
	type TrendingQuery,
	type ForMeQuery,
} from './schemas'
export {
	RECOMMENDATIONS_MAX_LIMIT,
	RECOMMENDATIONS_AFFINITY_MIN_VIEWS,
} from './config'
