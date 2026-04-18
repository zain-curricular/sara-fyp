// ============================================================================
// Description Generator — orchestration (listing → AI → listings.ai_description)
// ============================================================================

import 'server-only'

import { getCategoryById } from '@/lib/features/product-catalog/services'
import { updateListingById, ListingServiceError } from '@/lib/features/listings/core/services'
import type { ListingRow } from '@/lib/supabase/database.types'

import { AiError } from '../shared/_errors/aiErrors'
import { AI_DESCRIPTION_MAX_OUTPUT_TOKENS } from '../shared/config'
import { generateTextBounded } from '../shared/services'
import { listingDescriptionSystemPrompt } from './_prompts/listingDescriptionSystem'
import { buildListingDescriptionPrompt } from './_prompts/listingDescription'
import { extractListingDetailsForPrompt } from './_utils/extractListingDetailsForPrompt'
import type { TrustedUserId } from '../shared/types'
import type { AiModelKey } from '../shared/types'

function modelForPlatform(platform: ListingRow['platform']): AiModelKey {
	return platform === 'automotive' ? 'sonnet' : 'haiku'
}

export type GenerateListingDescriptionResult = {
	listing: ListingRow
	description: string
}

/**
 * Generates marketing copy from listing + category spec, persists `ai_description`,
 * and returns the updated listing row.
 *
 * @param input.userId — Authenticated owner (must match `listing.user_id`).
 */
export async function generateListingDescription(input: {
	listing: ListingRow
	userId: TrustedUserId
}): Promise<{ data: GenerateListingDescriptionResult | null; error: unknown }> {
	const { listing, userId } = input
	if (listing.user_id !== userId) {
		return { data: null, error: new ListingServiceError('FORBIDDEN') }
	}

	const { data: category, error: catErr } = await getCategoryById(listing.category_id)
	if (catErr) {
		return {
			data: null,
			error: new ListingServiceError('INTERNAL', 'Category load failed'),
		}
	}
	if (!category) {
		return { data: null, error: new ListingServiceError('NOT_FOUND', 'Category not found') }
	}

	const specSchema = category.spec_schema as Record<string, unknown>
	const specSummary = extractListingDetailsForPrompt(specSchema, listing.details)

	const prompt = buildListingDescriptionPrompt({
		platform: listing.platform,
		title: listing.title,
		categoryName: category.name,
		specSummary,
	})

	let text: string
	try {
		const out = await generateTextBounded({
			prompt,
			system: listingDescriptionSystemPrompt,
			model: modelForPlatform(listing.platform),
			feature: 'description_generator',
			userId,
			maxOutputTokens: AI_DESCRIPTION_MAX_OUTPUT_TOKENS,
		})
		text = out.data.trim()
	} catch (e) {
		if (AiError.isAiError(e)) {
			return { data: null, error: e }
		}
		return {
			data: null,
			error: new ListingServiceError('INTERNAL', 'AI generation failed'),
		}
	}

	const { data: updated, error: upErr } = await updateListingById(listing.id, {
		ai_description: text,
	})
	if (upErr || !updated) {
		return {
			data: null,
			error: new ListingServiceError('INTERNAL', 'Listing update failed'),
		}
	}

	return { data: { listing: updated, description: text }, error: null }
}
