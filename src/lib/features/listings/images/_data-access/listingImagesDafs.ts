// ============================================================================
// Listing images — data access (typed admin client)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'
import { isNotFoundError } from '@/lib/utils/isNotFoundError'
import type { Database, ListingImageRow } from '@/lib/supabase/database.types'

type ListingImageInsert = Database['public']['Tables']['listing_images']['Insert']

export async function countImagesForListing(
	listingId: string,
): Promise<{ data: number; error: unknown }> {
	const { count, error } = await getAdmin()
		.from('listing_images')
		.select('id', { count: 'exact', head: true })
		.eq('listing_id', listingId)

	if (error) {
		logDatabaseError('listingImages:countImagesForListing', { listingId }, error)
	}
	return { data: count ?? 0, error }
}

export async function listImagesForListing(
	listingId: string,
): Promise<{ data: ListingImageRow[] | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('listing_images')
		.select('*')
		.eq('listing_id', listingId)
		.order('position', { ascending: true })

	if (error) {
		logDatabaseError('listingImages:listImagesForListing', { listingId }, error)
	}
	return { data, error }
}

/**
 * Creates a listing_images row for a listing photo.
 */
export async function createListingImage(
	row: ListingImageInsert,
): Promise<{ data: ListingImageRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('listing_images')
		.insert(row)
		.select('*')
		.maybeSingle()
	if (error) {
		logDatabaseError('listingImages:createListingImage', {}, error)
	}
	return { data, error }
}

export async function deleteListingImageById(id: string): Promise<{ error: unknown }> {
	const { error } = await getAdmin().from('listing_images').delete().eq('id', id)
	if (error) {
		logDatabaseError('listingImages:deleteListingImageById', { id }, error)
	}
	return { error }
}

export async function updateListingImagePosition(
	id: string,
	position: number,
): Promise<{ error: unknown }> {
	const { error } = await getAdmin().from('listing_images').update({ position }).eq('id', id)
	if (error) {
		logDatabaseError('listingImages:updateListingImagePosition', { id, position }, error)
	}
	return { error }
}

export async function getListingImageById(
	id: string,
): Promise<{ data: ListingImageRow | null; error: unknown }> {
	const { data, error } = await getAdmin()
		.from('listing_images')
		.select('*')
		.eq('id', id)
		.maybeSingle()
	if (error && !isNotFoundError(error)) {
		logDatabaseError('listingImages:getListingImageById', { id }, error)
	}
	return { data, error: isNotFoundError(error) ? null : error }
}
