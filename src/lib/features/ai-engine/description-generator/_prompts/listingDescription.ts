// ============================================================================
// Description Generator — user prompt templates (mobile vs automotive)
// ============================================================================

import type { PlatformType } from '@/lib/supabase/database.types'

export function buildListingDescriptionPrompt(input: {
	platform: PlatformType
	title: string
	specSummary: string
}): string {
	if (input.platform === 'automotive') {
		return `Write a short listing description for a vehicle.

Title: ${input.title}
Known details: ${input.specSummary}

Use 2–4 short paragraphs. Mention safety and inspection context where relevant.`
	}

	return `Write a short listing description for a mobile device.

Title: ${input.title}
Known details: ${input.specSummary}

Use 2–4 short paragraphs. Mention condition and included accessories only if provided.`
}
