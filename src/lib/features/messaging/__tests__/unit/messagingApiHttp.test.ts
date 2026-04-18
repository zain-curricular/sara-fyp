// ============================================================================
// Unit tests — messagingApiHttp
// ============================================================================

import { describe, it, expect } from 'vitest'

import { messagingMutationErrorToHttp } from '../../_utils/messagingApiHttp'

describe('messagingMutationErrorToHttp', () => {
	it('maps domain errors', () => {
		expect(messagingMutationErrorToHttp(new Error('NOT_FOUND')).status).toBe(404)
		expect(messagingMutationErrorToHttp(new Error('FORBIDDEN')).status).toBe(403)
		expect(messagingMutationErrorToHttp(new Error('CANNOT_MESSAGE_OWN_LISTING')).status).toBe(403)
		expect(messagingMutationErrorToHttp(new Error('LISTING_NOT_ACTIVE')).status).toBe(409)
	})
})
