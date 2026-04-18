// ============================================================================
// Profiles — server barrel
// ============================================================================
//
// Single entry for API routes: data access, auth wrappers, and service
// orchestrators. `import 'server-only'` prevents accidental client bundling.

import 'server-only'

export {
	getProfileById,
	getProfileByHandle,
	updateProfile,
	claimHandleForProfile,
} from './_data-access/profilesDafs'

export {
	authenticateAndAuthorizeAdminProfile,
	authenticateAdmin,
} from './_auth/profilesAuth'

export { getProfile, getPublicProfileByHandle } from './_utils/getProfile'
export { getOwnProfile } from './_utils/getOwnProfile'
export { updateOwnProfile } from './_utils/updateOwnProfile'
export { adminUpdateProfile } from './_utils/adminUpdateProfile'
export { uploadAvatar } from './_utils/uploadAvatar'
