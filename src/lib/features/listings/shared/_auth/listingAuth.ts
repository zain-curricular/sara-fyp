// ============================================================================
// Listings — authorization helpers
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { getListingById } from '@/lib/features/listings/core/services'
import { getProfileById } from '@/lib/features/profiles/services'
import type { ListingRow } from '@/lib/supabase/database.types'

export type ListingOwnerAuthResult =
	| { listing: ListingRow; user: { id: string }; error: null }
	| { listing: null; user: null; error: NextResponse }

/**
 * Bearer JWT + listing exists + caller owns the listing (non-deleted rows only).
 *
 * @param request - Incoming HTTP request.
 * @param listingId - Target listing id from the URL segment.
 */
export async function authenticateAndAuthorizeListing(
	request: Request,
	listingId: string,
): Promise<ListingOwnerAuthResult> {
	const auth = await authenticateFromRequest(request)
	if (auth.error) {
		return { listing: null, user: null, error: auth.error }
	}

	const { data: listing } = await getListingById(listingId)
	if (!listing || listing.deleted_at) {
		return {
			listing: null,
			user: null,
			error: NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 }),
		}
	}

	if (listing.user_id !== auth.user.id) {
		return {
			listing: null,
			user: null,
			error: NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 }),
		}
	}

	return { listing, user: auth.user, error: null }
}

export type AdminListingAuthResult =
	| { listing: ListingRow; user: { id: string }; error: null }
	| { listing: null; user: null; error: NextResponse }

/**
 * Bearer JWT + `profiles.role === 'admin'` + loads the target listing.
 *
 * Returning the loaded row lets routes return 404 for missing listings without
 * a second fetch, and keeps the pattern consistent with admin profile auth.
 *
 * @param request - Incoming HTTP request.
 * @param listingId - Target listing id from the URL segment.
 */
export async function authenticateAndAuthorizeAdminListing(
	request: Request,
	listingId: string,
): Promise<AdminListingAuthResult> {
	const auth = await authenticateFromRequest(request)
	if (auth.error) {
		return { listing: null, user: null, error: auth.error }
	}

	// Caller must be admin
	const { data: caller } = await getProfileById(auth.user.id)
	if (!caller || caller.role !== 'admin') {
		return {
			listing: null,
			user: null,
			error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }),
		}
	}

	// Load target so routes can return 404 cleanly
	const { data: listing } = await getListingById(listingId)
	if (!listing) {
		return {
			listing: null,
			user: null,
			error: NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 }),
		}
	}

	return { listing, user: auth.user, error: null }
}
