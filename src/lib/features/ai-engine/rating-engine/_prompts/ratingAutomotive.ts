// ============================================================================
// Rating Engine — automotive platform prompts
// ============================================================================

import type { PlatformType } from '@/lib/supabase/database.types'

import { extractListingDetailsForPrompt } from '../../description-generator/_utils/extractListingDetailsForPrompt'

export const ratingAutomotiveSystemPrompt = `You are an expert vehicle inspection analyst summarizing results for marketplace buyers.
Return only JSON matching the requested schema. Scores are integers 1–10. Be factual; do not invent issues not supported by the inspection data.`

function truncateJson(value: unknown, maxLen: number): string {
	const s = JSON.stringify(value)
	if (s.length <= maxLen) return s
	return `${s.slice(0, maxLen)}…(truncated)`
}

export function buildRatingPromptAutomotive(input: {
	listingTitle: string
	platform: PlatformType
	categoryName: string
	specSchema: Record<string, unknown>
	listingDetails: Record<string, unknown>
	inspectionResults: unknown
	overallScore: number | null
	overallNotes: string | null
	passed: boolean | null
}): string {
	const specSummary = extractListingDetailsForPrompt(input.specSchema, input.listingDetails)
	const inspectionJson = truncateJson(input.inspectionResults, 12_000)

	return `Produce a buyer-facing rating summary for this vehicle listing.

Listing title: ${input.listingTitle}
Platform: ${input.platform}
Category: ${input.categoryName}
Listing spec facts (from category schema only):
${specSummary}

Inspection results (JSON):
${inspectionJson}

Tester overall_score (if any): ${input.overallScore ?? 'n/a'}
Tester overall_notes (if any): ${input.overallNotes ?? 'n/a'}
Report passed flag: ${input.passed === null ? 'n/a' : String(input.passed)}

Fill breakdown scores (engine, transmission, body, electrical, comfort) consistently with the inspection evidence.
Write summary, pros, and cons for a buyer; mention safety only when supported by data.`
}
