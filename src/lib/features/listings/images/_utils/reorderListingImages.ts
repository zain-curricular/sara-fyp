// ============================================================================
// Listings — reorder images (positions 0..n-1)
// ============================================================================

import { getListingImageById, updateListingImagePosition } from '../_data-access/listingImagesDafs'
import { getListingById } from '@/lib/features/listings/core/services'
import { ImageServiceError } from './addListingImage'

/**
 * Sets `position` order for the given image ids (must belong to the listing).
 */
export async function reorderListingImages(
	listingId: string,
	userId: string,
	imageIds: string[],
): Promise<{ error: unknown }> {
	const { data: listing, error: lErr } = await getListingById(listingId)
	if (lErr) {
		return { error: lErr }
	}
	if (!listing || listing.user_id !== userId) {
		return { error: new ImageServiceError('NOT_FOUND') }
	}

	for (let i = 0; i < imageIds.length; i++) {
		const id = imageIds[i]
		const { data: img, error: gErr } = await getListingImageById(id)
		if (gErr) {
			return { error: gErr }
		}
		if (!img || img.listing_id !== listingId) {
			return { error: new ImageServiceError('NOT_FOUND') }
		}
		const { error } = await updateListingImagePosition(id, i)
		if (error) {
			return { error }
		}
	}

	return { error: null }
}
