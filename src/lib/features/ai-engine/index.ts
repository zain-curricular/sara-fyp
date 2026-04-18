// ============================================================================
// AI Engine — root client-safe barrel
// ============================================================================

export type { AiFeatureKey } from './shared/config'
export {
	AI_RATE_LIMITS,
	AI_MODELS,
	AI_TIMEOUT_MS,
	AI_MODERATION_TIMEOUT_MS,
	AI_MAX_RETRIES,
	AI_DESCRIPTION_MAX_OUTPUT_TOKENS,
} from './shared/config'
export type { AiModelKey, AiUsage, AiGenerateSuccess, TrustedUserId } from './shared/types'
