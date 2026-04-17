// ============================================================================
// Listings — delete one image (storage + row)
// ============================================================================

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'

import { deleteListingImageById, getListingImageById } from '../_data-access/listingImagesDafs'
import { getListingById } from '@/lib/features/listings/core/services'
import { ImageServiceError } from './addListingImage'

export async function deleteListingImageForOwner(
	imageId: string,
	listingId: string,
	userId: string,
): Promise<{ error: unknown }> {
	const { data: listing, error: lErr } = await getListingById(listingId)
	if (lErr) {
		return { error: lErr }
	}
	if (!listing || listing.user_id !== userId) {
		return { error: new ImageServiceError('NOT_FOUND') }
	}

	const { data: img, error: gErr } = await getListingImageById(imageId)
	if (gErr) {
		return { error: gErr }
	}
	if (!img || img.listing_id !== listingId) {
		return { error: new ImageServiceError('NOT_FOUND') }
	}

	const { error: rmErr } = await getAdmin().storage.from('listing-images').remove([img.storage_path])
	if (rmErr) {
		logDatabaseError('listingImages:storageRemove', { imageId }, rmErr)
		return { error: rmErr }
	}

	return deleteListingImageById(imageId)
}
