// ============================================================================
// AI Engine — root server barrel (re-exports shared; sub-features later)
// ============================================================================

import 'server-only'

export {
	generateStructured,
	generateTextBounded,
	moderateInput,
	assertAiRateLimit,
	trackAiUsage,
	getAnthropicProvider,
	getAnthropicLanguageModel,
	getOpenAIProvider,
	getOpenAiMiniModel,
	AiError,
	aiErrorToHttp,
	_clearAiInMemoryRateLimitForTests,
} from './shared/services'

export { generateListingDescription } from './description-generator/services'

export {
	generateAiRating,
	regenerateAiRatingForListing,
	type AiRatingPayload,
} from './rating-engine/services'
