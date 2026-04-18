// ============================================================================
// Unit tests — warrantyApiHttp mappers
// ============================================================================

import { describe, it, expect } from 'vitest'

import {
	warrantyClaimMutationErrorToHttp,
	warrantyPhotoErrorToHttp,
} from '../../_utils/warrantyApiHttp'

describe('warrantyClaimMutationErrorToHttp', () => {
	it('maps known errors', () => {
		expect(warrantyClaimMutationErrorToHttp(new Error('NOT_FOUND')).status).toBe(404)
		expect(warrantyClaimMutationErrorToHttp(new Error('INVALID_TRANSITION')).status).toBe(409)
		expect(warrantyClaimMutationErrorToHttp(new Error('REPAIR_CENTER_REQUIRED')).status).toBe(400)
		expect(warrantyClaimMutationErrorToHttp(new Error('SPARE_PARTS_WRONG_STATE')).status).toBe(409)
		expect(warrantyClaimMutationErrorToHttp(new Error('TERMINAL_CLAIM')).status).toBe(409)
	})
})

describe('warrantyPhotoErrorToHttp', () => {
	it('maps PHOTO_LIMIT', () => {
		expect(warrantyPhotoErrorToHttp(new Error('PHOTO_LIMIT')).status).toBe(409)
	})
})
