// ============================================================================
// Listings — add image (storage + listing_images row)
// ============================================================================

import { randomUUID } from 'node:crypto'

import { getAdmin } from '@/lib/supabase/clients/adminClient'
import { logDatabaseError } from '@/lib/observability/logDatabaseError'

/** Stable error codes the route maps to HTTP status. */
export class ImageServiceError extends Error {
	constructor(
		public readonly code:
			| 'NOT_FOUND'
			| 'IMAGE_LIMIT_REACHED'
			| 'FILE_TOO_LARGE'
			| 'INVALID_MIME'
			| 'CREATE_FAILED',
		message?: string,
	) {
		super(message ?? code)
		this.name = 'ImageServiceError'
	}
}

import {
	countImagesForListing,
	createListingImage,
	listImagesForListing,
} from '../_data-access/listingImagesDafs'
import { getListingById } from '@/lib/features/listings/core/services'
import {
	LISTING_IMAGE_ALLOWED_MIME,
	LISTING_IMAGE_MAX_BYTES,
	LISTING_IMAGES_MAX,
} from '@/lib/features/listings/images/config'

function extFromMime(mime: string): string {
	if (mime === 'image/jpeg') {
		return 'jpg'
	}
	if (mime === 'image/png') {
		return 'png'
	}
	return 'webp'
}

/**
 * Uploads one image for a listing after verifying ownership and the 10-image cap.
 */
export async function addListingImageFromUpload(params: {
	userId: string
	listingId: string
	fileBytes: Uint8Array
	contentType: string
}): Promise<{ data: { id: string; url: string } | null; error: unknown }> {
	const { userId, listingId, fileBytes, contentType } = params

	if (fileBytes.byteLength > LISTING_IMAGE_MAX_BYTES) {
		return { data: null, error: new ImageServiceError('FILE_TOO_LARGE') }
	}
	if (!LISTING_IMAGE_ALLOWED_MIME.includes(contentType as (typeof LISTING_IMAGE_ALLOWED_MIME)[number])) {
		return { data: null, error: new ImageServiceError('INVALID_MIME') }
	}

	const { data: listing, error: lErr } = await getListingById(listingId)
	if (lErr) {
		return { data: null, error: lErr }
	}
	if (!listing || listing.user_id !== userId) {
		return { data: null, error: new ImageServiceError('NOT_FOUND') }
	}

	const { data: count, error: cErr } = await countImagesForListing(listingId)
	if (cErr) {
		return { data: null, error: cErr }
	}
	if (count >= LISTING_IMAGES_MAX) {
		return { data: null, error: new ImageServiceError('IMAGE_LIMIT_REACHED') }
	}

	const { data: existing } = await listImagesForListing(listingId)
	const nextPosition = (existing?.length ?? 0) < LISTING_IMAGES_MAX ? existing?.length ?? 0 : LISTING_IMAGES_MAX - 1

	const ext = extFromMime(contentType)
	const objectName = `${userId}/${listingId}/${randomUUID()}.${ext}`
	const storagePath = objectName

	const { error: upErr } = await getAdmin().storage.from('listing-images').upload(objectName, fileBytes, {
		contentType,
		upsert: false,
	})

	if (upErr) {
		logDatabaseError('listingImages:storageUpload', { listingId }, upErr)
		return { data: null, error: upErr }
	}

	const { data: pub } = getAdmin().storage.from('listing-images').getPublicUrl(objectName)
	const url = pub.publicUrl

	const { data: row, error: insErr } = await createListingImage({
		listing_id: listingId,
		storage_path: storagePath,
		url,
		position: nextPosition,
	})

	if (insErr || !row) {
		return { data: null, error: insErr ?? new ImageServiceError('CREATE_FAILED') }
	}

	return { data: { id: row.id, url: row.url }, error: null }
}
