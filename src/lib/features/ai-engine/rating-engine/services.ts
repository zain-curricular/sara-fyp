// ============================================================================
// Rating Engine — AI listing rating from inspection results (structured output)
// ============================================================================

import 'server-only'

import { getTestReportByOrderId } from '@/lib/features/device-testing/orderReads'
import { getCategoryById } from '@/lib/features/product-catalog/services'
import { getListingById, updateListingById, ListingServiceError } from '@/lib/features/listings/core/services'
import { listOrdersByListingId } from '@/lib/features/orders/services'
import type { CategoryRow, ListingRow, TestReportRow } from '@/lib/supabase/database.types'

import { AiError, generateStructured } from '../shared/services'
import type { TrustedUserId } from '../shared/types'

import { ratingAutomotiveOutputSchema, type RatingAutomotiveOutput } from './_schemas/ratingAutomotive'
import { ratingMobileOutputSchema, type RatingMobileOutput } from './_schemas/ratingMobile'
import {
	buildRatingPromptAutomotive,
	ratingAutomotiveSystemPrompt,
} from './_prompts/ratingAutomotive'
import { buildRatingPromptMobile, ratingMobileSystemPrompt } from './_prompts/ratingMobile'

export type AiRatingPayload = RatingMobileOutput | RatingAutomotiveOutput

function isAutomotiveListing(listing: ListingRow): boolean {
	return listing.platform === 'automotive'
}

/**
 * Computes a structured AI rating from inspection data and persists `listings.ai_rating`.
 *
 * @param input.userId — Rate-limit subject (listing owner on auto-trigger; admin id on regenerate).
 */
export async function generateAiRating(input: {
	listing: ListingRow
	report: TestReportRow
	category: CategoryRow
	userId: TrustedUserId
}): Promise<{ data: { rating: AiRatingPayload } | null; error: unknown }> {
	const { listing, report, category, userId } = input
	const specSchema = category.spec_schema as Record<string, unknown>

	const basePrompt = {
		listingTitle: listing.title,
		platform: listing.platform,
		categoryName: category.name,
		specSchema,
		listingDetails: listing.details,
		inspectionResults: report.inspection_results,
		overallScore: report.overall_score,
		overallNotes: report.overall_notes,
		passed: report.passed,
	}

	try {
		if (isAutomotiveListing(listing)) {
			const out = await generateStructured({
				schema: ratingAutomotiveOutputSchema,
				prompt: buildRatingPromptAutomotive(basePrompt),
				system: ratingAutomotiveSystemPrompt,
				model: 'sonnet',
				feature: 'rating_engine',
				userId,
			})
			const { data: updated, error: upErr } = await updateListingById(listing.id, {
				ai_rating: out.data as unknown as Record<string, unknown>,
			})
			if (upErr || !updated) {
				return { data: null, error: new ListingServiceError('INTERNAL', 'Failed to save AI rating') }
			}
			return { data: { rating: out.data }, error: null }
		}

		const out = await generateStructured({
			schema: ratingMobileOutputSchema,
			prompt: buildRatingPromptMobile(basePrompt),
			system: ratingMobileSystemPrompt,
			model: 'sonnet',
			feature: 'rating_engine',
			userId,
		})
		const { data: updated, error: upErr } = await updateListingById(listing.id, {
			ai_rating: out.data as unknown as Record<string, unknown>,
		})
		if (upErr || !updated) {
			return { data: null, error: new ListingServiceError('INTERNAL', 'Failed to save AI rating') }
		}
		return { data: { rating: out.data }, error: null }
	} catch (e) {
		if (AiError.isAiError(e)) {
			return { data: null, error: e }
		}
		return { data: null, error: new ListingServiceError('INTERNAL', 'AI rating failed') }
	}
}

/**
 * Admin: regenerate rating from the latest submitted test report linked to this listing.
 */
export async function regenerateAiRatingForListing(input: {
	listingId: string
	adminUserId: TrustedUserId
}): Promise<{ data: { rating: AiRatingPayload; listing: ListingRow } | null; error: unknown }> {
	const { data: listing, error: lErr } = await getListingById(input.listingId)
	if (lErr) {
		return { data: null, error: new ListingServiceError('INTERNAL', 'Failed to load listing') }
	}
	if (!listing) {
		return { data: null, error: new ListingServiceError('NOT_FOUND') }
	}

	const { data: orders, error: oErr } = await listOrdersByListingId(input.listingId)
	if (oErr) {
		return { data: null, error: new ListingServiceError('INTERNAL', 'Failed to load orders') }
	}
	if (!orders?.length) {
		return { data: null, error: new ListingServiceError('NOT_FOUND', 'No orders for listing') }
	}

	let report: TestReportRow | null = null
	for (const order of orders) {
		const { data: tr, error: trErr } = await getTestReportByOrderId(order.id)
		if (trErr) {
			return { data: null, error: new ListingServiceError('INTERNAL', 'Failed to load test report') }
		}
		if (tr && tr.passed !== null) {
			report = tr
			break
		}
	}

	if (!report) {
		return {
			data: null,
			error: new ListingServiceError('NOT_FOUND', 'No submitted test report for listing'),
		}
	}

	const { data: category, error: cErr } = await getCategoryById(listing.category_id)
	if (cErr) {
		return { data: null, error: new ListingServiceError('INTERNAL', 'Failed to load category') }
	}
	if (!category) {
		return { data: null, error: new ListingServiceError('NOT_FOUND', 'Category not found') }
	}

	const gen = await generateAiRating({
		listing,
		report,
		category,
		userId: input.adminUserId,
	})
	if (gen.error || !gen.data) {
		return { data: null, error: gen.error ?? new ListingServiceError('INTERNAL') }
	}

	const { data: fresh } = await getListingById(listing.id)
	if (!fresh) {
		return { data: null, error: new ListingServiceError('INTERNAL') }
	}

	return { data: { rating: gen.data.rating, listing: fresh }, error: null }
}
