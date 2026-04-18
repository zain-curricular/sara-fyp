// ============================================================================
// Warranty & after-sales — server barrel
// ============================================================================

import 'server-only'

export type {
	ClaimDetailPayload,
	PaginatedWarranties,
	PaginatedWarrantyClaims,
} from './_utils/warrantyReadService'

export { authenticateAndAuthorizeAdmin } from '@/lib/auth/adminRole'
export {
	listMyWarranties,
	getWarrantyForParticipant,
	getClaimDetailForParticipant,
	listClaimsForAdmin,
	listActiveRepairCenters,
} from './_utils/warrantyReadService'
export {
	createWarrantyClaim,
	addPhotoToWarrantyClaim,
	adminUpdateWarrantyClaim,
	adminCreateSparePartsOrder,
	adminUpdateSparePartsOrder,
	adminCreateRepairCenter,
	adminUpdateRepairCenter,
} from './_utils/warrantyClaimOps'
export {
	warrantyClaimMutationErrorToHttp,
	warrantyPhotoErrorToHttp,
	sparePartsMutationErrorToHttp,
	repairCenterMutationErrorToHttp,
} from './_utils/warrantyApiHttp'
export {
	createWarrantyClaimBodySchema,
	adminPatchWarrantyClaimBodySchema,
	listWarrantyClaimsAdminQuerySchema,
	warrantiesMeQuerySchema,
	createRepairCenterBodySchema,
	patchRepairCenterBodySchema,
	createSparePartsOrderBodySchema,
	patchSparePartsOrderBodySchema,
} from './schemas'
