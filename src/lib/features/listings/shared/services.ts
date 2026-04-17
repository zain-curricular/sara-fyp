// ============================================================================
// Listings / shared — server barrel
// ============================================================================

import 'server-only'

export {
	validateDetailsAgainstSchema,
	type DetailsValidationResult,
} from './_utils/validateDetailsAgainstSchema'

export {
	authenticateAndAuthorizeAdminListing,
	type AdminListingAuthResult,
} from './_auth/listingAuth'
