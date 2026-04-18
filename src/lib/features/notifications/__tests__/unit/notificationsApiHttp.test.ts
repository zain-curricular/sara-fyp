// ============================================================================
// Unit tests — notifications HTTP error mapping
// ============================================================================

import { describe, expect, it } from 'vitest'

import { notificationsMutationErrorToHttp } from '../../_utils/notificationsApiHttp'

describe('notificationsMutationErrorToHttp', () => {
	it('maps NOT_FOUND to 404', () => {
		const { status, body } = notificationsMutationErrorToHttp(new Error('NOT_FOUND'))
		expect(status).toBe(404)
		expect(body.ok).toBe(false)
	})

	it('maps unknown to 500', () => {
		const { status } = notificationsMutationErrorToHttp(new Error('other'))
		expect(status).toBe(500)
	})
})
