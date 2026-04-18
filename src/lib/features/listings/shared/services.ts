// ============================================================================
// Listings / shared — server barrel
// ============================================================================

import 'server-only'

export {
	validateDetailsAgainstSchema,
	type DetailsValidationResult,
} from './_utils/validateDetailsAgainstSchema'

export {
	authenticateAndAuthorizeListing,
	authenticateAndAuthorizeAdminListing,
	type ListingOwnerAuthResult,
	type AdminListingAuthResult,
} from './_auth/listingAuth'
