// ============================================================================
// Listings — create / update / publish / remove orchestration
// ============================================================================
//
// Orchestrators live in `_utils/` per feature-module convention. They validate
// cross-feature input (spec_schema from product-catalog) and translate DB
// errors into service-layer errors with a short `.code` string the route can
// map to HTTP.

import { getCategoryById } from '@/lib/features/product-catalog/services'
import {
	countActiveListingsForUser,
	createListing,
	deleteListing,
	getListingById,
	updateListingById,
} from '../_data-access/listingsDafs'
import type { CreateListingInput, UpdateListingInput } from '../schemas'
import { validateDetailsAgainstSchema } from '@/lib/features/listings/shared/services'
import type { Database, ListingRow } from '@/lib/supabase/database.types'
import { DEFAULT_FREE_LISTING_LIMIT } from '@/lib/features/listings/core/config'

type ListingUpdate = Database['public']['Tables']['listings']['Update']

/**
 * Service-layer error with a stable code routes can map to HTTP status.
 */
export class ListingServiceError extends Error {
	constructor(
		public readonly code:
			| 'NOT_FOUND'
			| 'FORBIDDEN'
			| 'DETAILS_INVALID'
			| 'CATEGORY_MISMATCH'
			| 'INVALID_STATUS'
			| 'LISTING_LIMIT_REACHED'
			| 'LOCKED',
		message?: string,
		public readonly fields?: string[],
	) {
		super(message ?? code)
		this.name = 'ListingServiceError'
	}
}

/**
 * Creates a draft listing row after validating `details` against the category spec.
 */
export async function createDraftListing(
	userId: string,
	input: CreateListingInput,
): Promise<{ data: ListingRow | null; error: unknown }> {
	const { data: cat, error: cErr } = await getCategoryById(input.category_id)
	if (cErr) {
		return { data: null, error: cErr }
	}
	if (!cat) {
		return { data: null, error: new ListingServiceError('NOT_FOUND', 'Category not found') }
	}
	if (cat.platform !== input.platform) {
		return { data: null, error: new ListingServiceError('CATEGORY_MISMATCH') }
	}

	const v = validateDetailsAgainstSchema(cat.spec_schema, input.details)
	if (!v.ok) {
		return {
			data: null,
			error: new ListingServiceError('DETAILS_INVALID', 'Invalid details', v.errors),
		}
	}

	return createListing({
		user_id: userId,
		platform: input.platform,
		category_id: input.category_id,
		model_id: input.model_id ?? null,
		title: input.title,
		description: input.description ?? null,
		sale_type: input.sale_type,
		price: input.price,
		is_negotiable: input.is_negotiable ?? false,
		condition: input.condition,
		details: v.data,
		city: input.city,
		area: input.area ?? null,
		status: 'draft',
	})
}

/**
 * Updates a listing owned by `userId`. Re-validates details if present.
 */
export async function updateOwnListing(
	listingId: string,
	userId: string,
	input: UpdateListingInput,
): Promise<{ data: ListingRow | null; error: unknown }> {
	const { data: existing, error: gErr } = await getListingById(listingId)
	if (gErr) {
		return { data: null, error: gErr }
	}
	if (!existing) {
		return { data: null, error: new ListingServiceError('NOT_FOUND') }
	}
	if (existing.user_id !== userId) {
		return { data: null, error: new ListingServiceError('NOT_FOUND') }
	}
	if (existing.status === 'sold' || existing.deleted_at) {
		return { data: null, error: new ListingServiceError('LOCKED', 'Listing cannot be edited') }
	}

	const patch: ListingUpdate = {}
	if (input.platform !== undefined) patch.platform = input.platform
	if (input.category_id !== undefined) patch.category_id = input.category_id
	if (input.model_id !== undefined) patch.model_id = input.model_id
	if (input.title !== undefined) patch.title = input.title
	if (input.description !== undefined) patch.description = input.description
	if (input.sale_type !== undefined) patch.sale_type = input.sale_type
	if (input.price !== undefined) patch.price = input.price
	if (input.is_negotiable !== undefined) patch.is_negotiable = input.is_negotiable
	if (input.condition !== undefined) patch.condition = input.condition
	if (input.city !== undefined) patch.city = input.city
	if (input.area !== undefined) patch.area = input.area

	if (input.details !== undefined) {
		const categoryId = input.category_id ?? existing.category_id
		const { data: cat, error: cErr } = await getCategoryById(categoryId)
		if (cErr) {
			return { data: null, error: cErr }
		}
		if (!cat) {
			return { data: null, error: new ListingServiceError('NOT_FOUND', 'Category not found') }
		}
		const v = validateDetailsAgainstSchema(cat.spec_schema, input.details)
		if (!v.ok) {
			return {
				data: null,
				error: new ListingServiceError('DETAILS_INVALID', 'Invalid details', v.errors),
			}
		}
		patch.details = v.data
	}

	return updateListingById(listingId, patch)
}

/**
 * Publishes a draft listing. The DB trigger `check_listing_limit` enforces
 * the quota atomically; this service adds a pre-check for a nicer UX error.
 */
export async function publishListing(
	listingId: string,
	userId: string,
): Promise<{ data: ListingRow | null; error: unknown }> {
	const { data: row, error: gErr } = await getListingById(listingId)
	if (gErr) {
		return { data: null, error: gErr }
	}
	if (!row) {
		return { data: null, error: new ListingServiceError('NOT_FOUND') }
	}
	if (row.user_id !== userId) {
		return { data: null, error: new ListingServiceError('NOT_FOUND') }
	}
	if (row.status !== 'draft' && row.status !== 'pending_review') {
		return { data: null, error: new ListingServiceError('INVALID_STATUS') }
	}

	// Pre-check against the free-tier default. The subscriptions feature will
	// own the authoritative quota query once it lands — for now, the DB trigger
	// is the source of truth.
	const { data: currentCount, error: ctErr } = await countActiveListingsForUser(userId)
	if (ctErr) {
		return { data: null, error: ctErr }
	}
	if (currentCount >= DEFAULT_FREE_LISTING_LIMIT) {
		return { data: null, error: new ListingServiceError('LISTING_LIMIT_REACHED') }
	}

	const { data, error } = await updateListingById(listingId, {
		status: 'active',
		published_at: new Date().toISOString(),
	})

	// Detect the DB trigger's exception when it fires on a race.
	if (error instanceof Error && error.message.startsWith('Listing limit reached')) {
		return { data: null, error: new ListingServiceError('LISTING_LIMIT_REACHED') }
	}

	return { data, error }
}

/**
 * Removes a listing: hard-deletes drafts, soft-deletes anything else.
 */
export async function removeListing(
	listingId: string,
	userId: string,
): Promise<{ error: unknown }> {
	const { data: row, error: gErr } = await getListingById(listingId)
	if (gErr) {
		return { error: gErr }
	}
	if (!row) {
		return { error: new ListingServiceError('NOT_FOUND') }
	}
	if (row.user_id !== userId) {
		return { error: new ListingServiceError('NOT_FOUND') }
	}

	if (row.status === 'draft') {
		return deleteListing(listingId)
	}

	const { error } = await updateListingById(listingId, {
		status: 'removed',
		deleted_at: new Date().toISOString(),
	})
	return { error }
}

/**
 * Public detail read: only `active` listings without soft-delete.
 */
export async function getListingForPublic(
	listingId: string,
): Promise<{ data: ListingRow | null; error: unknown }> {
	const { data, error } = await getListingById(listingId)
	if (error) {
		return { data: null, error }
	}
	if (!data || data.deleted_at || data.status !== 'active') {
		return { data: null, error: null }
	}
	return { data, error: null }
}

/**
 * Admin moderation: flag, restore, or remove (soft-delete) a listing.
 */
export async function adminModerateListing(
	listingId: string,
	status: 'flagged' | 'active' | 'removed',
): Promise<{ data: ListingRow | null; error: unknown }> {
	const patch: ListingUpdate = { status }
	if (status === 'removed') {
		patch.deleted_at = new Date().toISOString()
	}
	return updateListingById(listingId, patch)
}
