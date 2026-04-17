// ============================================================================
// Listings / core — data access (typed admin client)
// ============================================================================
//
// Pure DB queries for the `listings` table. Authorization is enforced in
// services and the DB (RLS + check_listing_limit trigger on status changes).
// DAFs never throw — they return `{ data, error }` or `PaginatedResult`.

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import {
	SEARCH_LIMIT_DEFAULT,
	SEARCH_LIMIT_MAX,
	SEARCH_PAGE_MAX,
	SEARCH_Q_MAX,
	SEARCH_Q_TSVECTOR_MIN,
} from '@/lib/features/listings/search/config'
import { OWN_LISTINGS_PAGE_MAX } from '@/lib/features/listings/core/config'
import type { Database, ListingRow, PlatformType } from '@/lib/supabase/database.types'

type ListingInsert = Database['public']['Tables']['listings']['Insert']
type ListingUpdate = Database['public']['Tables']['listings']['Update']

/** Paginated result shape per data-access conventions. */
export type PaginatedListings = {
	data: ListingRow[] | null
	pagination: { total: number; limit: number; offset: number; hasMore: boolean }
	error: unknown
}

export type ListingSearchFilters = {
	platform?: PlatformType
	categoryId?: string
	modelId?: string
	city?: string
	priceMin?: number
	priceMax?: number
	q?: string
	page?: number
	limit?: number
}

function escapeIlike(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

/**
 * Creates a listing row. Caller must set `user_id`.
 */
export async function createListing(
	row: ListingInsert,
): Promise<{ data: ListingRow | null; error: unknown }> {
	const { data, error } = await getAdmin().from('listings').insert(row).select('*').maybeSingle()
	if (error) {
		logDatabaseError('listings:createListing', {}, error)
	}
	return { data, error }
}

export async function updateListingById(
	id: string,
	patch: ListingUpdate,
): Promise<{ data: ListingRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('listings')
		.update(patch)
		.eq('id', id)
		.select('*')
		.maybeSingle()
	if (error && !isNotFoundError(error)) {
		logDatabaseError('listings:updateListingById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

export async function getListingById(
	id: string,
): Promise<{ data: ListingRow | null; error: unknown }> {
	const { data, error } = await getAdmin().from('listings').select('*').eq('id', id).maybeSingle()
	if (error && !isNotFoundError(error)) {
		logDatabaseError('listings:getListingById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}

/**
 * Batch load non-deleted listings by id (order not preserved — callers reorder).
 */
export async function listListingsByIds(
	ids: string[],
): Promise<{ data: ListingRow[] | null; error: unknown }> {
	if (ids.length === 0) {
		return { data: [], error: null }
	}
	const { data, error } = await getAdmin()
		.from('listings')
		.select('*')
		.in('id', ids)
		.is('deleted_at', null)

	if (error) {
		logDatabaseError('listings:listListingsByIds', { count: ids.length }, error)
	}
	return { data: data as ListingRow[] | null, error }
}

/**
 * Hard-deletes a listing row (valid only for `draft` per RLS — caller enforces).
 */
export async function deleteListing(id: string): Promise<{ error: unknown }> {
	const { error } = await getAdmin().from('listings').delete().eq('id', id)
	if (error) {
		logDatabaseError('listings:deleteListing', { id }, error)
	}
	return { error }
}

/**
 * Active + pending_review count for a user (used by quota checks).
 */
export async function countActiveListingsForUser(
	userId: string,
): Promise<{ data: number; error: unknown }> {
	const { count, error } = await getAdmin()
		.from('listings')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId)
		.in('status', ['active', 'pending_review'])
		.is('deleted_at', null)

	if (error) {
		logDatabaseError('listings:countActiveListingsForUser', { userId }, error)
	}
	return { data: count ?? 0, error }
}

/**
 * Public search: `status = active`, not soft-deleted. Uses `search_vector` for
 * longer queries and `title` ilike fallback for short strings.
 *
 * @returns PaginatedResult with typed rows and pagination envelope.
 */
export async function searchListings(filters: ListingSearchFilters): Promise<PaginatedListings> {
	const page = Math.min(Math.max(filters.page ?? 1, 1), SEARCH_PAGE_MAX)
	const limit = Math.min(Math.max(filters.limit ?? SEARCH_LIMIT_DEFAULT, 1), SEARCH_LIMIT_MAX)
	const offset = (page - 1) * limit
	const to = offset + limit - 1

	let q = getAdmin()
		.from('listings')
		.select('*', { count: 'exact' })
		.eq('status', 'active')
		.is('deleted_at', null)

	if (filters.platform) {
		q = q.eq('platform', filters.platform)
	}
	if (filters.categoryId) {
		q = q.eq('category_id', filters.categoryId)
	}
	if (filters.modelId) {
		q = q.eq('model_id', filters.modelId)
	}
	if (filters.city) {
		q = q.ilike('city', `%${escapeIlike(filters.city.trim())}%`)
	}
	if (filters.priceMin !== undefined) {
		q = q.gte('price', filters.priceMin)
	}
	if (filters.priceMax !== undefined) {
		q = q.lte('price', filters.priceMax)
	}

	const rawQ = filters.q?.trim().slice(0, SEARCH_Q_MAX) ?? ''
	if (rawQ.length >= SEARCH_Q_TSVECTOR_MIN) {
		q = q.textSearch('search_vector', rawQ, { type: 'websearch', config: 'english' })
	} else if (rawQ.length > 0) {
		const pat = `%${escapeIlike(rawQ)}%`
		q = q.ilike('title', pat)
	}

	const { data, error, count } = await q.order('created_at', { ascending: false }).range(offset, to)

	if (error) {
		logDatabaseError('listings:searchListings', { filters }, error)
	}

	const total = count ?? 0
	return {
		data,
		pagination: { total, limit, offset, hasMore: total > offset + limit },
		error,
	}
}

/**
 * Seller dashboard: all (non-soft-deleted) listings for a user.
 */
export async function listListingsByUserId(
	userId: string,
): Promise<{ data: ListingRow[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('listings')
		.select('*')
		.eq('user_id', userId)
		.is('deleted_at', null)
		.order('created_at', { ascending: false })
		.limit(OWN_LISTINGS_PAGE_MAX)

	if (error) {
		logDatabaseError('listings:listListingsByUserId', { userId }, error)
	}
	return { data, error }
}
