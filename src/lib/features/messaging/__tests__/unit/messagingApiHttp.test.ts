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

	it('maps Postgres-style RPC messages', () => {
		expect(messagingMutationErrorToHttp(new Error('CONVERSATION_NOT_FOUND')).status).toBe(404)
		expect(messagingMutationErrorToHttp(new Error('NOT_PARTICIPANT')).status).toBe(403)
		expect(messagingMutationErrorToHttp(new Error('NOT_AUTHENTICATED')).status).toBe(401)
	})

	it('maps JWT-related failures to 401', () => {
		expect(messagingMutationErrorToHttp(new Error('JWT expired')).status).toBe(401)
	})

	it('maps insert/upsert failures to 500', () => {
		expect(messagingMutationErrorToHttp(new Error('INSERT_FAILED')).status).toBe(500)
		expect(messagingMutationErrorToHttp(new Error('UPSERT_FAILED')).status).toBe(500)
	})
})
