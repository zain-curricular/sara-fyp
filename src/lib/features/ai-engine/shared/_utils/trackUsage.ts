// ============================================================================
// AI Engine — usage logging (optional DB table deferred)
// ============================================================================

import type { AiUsage } from '../types'

/**
 * Hook for future `ai_usage_logs` inserts. No-op for now.
 */
export async function trackAiUsage(_usage: AiUsage): Promise<void> {
	return
}
