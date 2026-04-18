// ============================================================================
// API integration tests — POST /api/webhooks/payment
// ============================================================================

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'

import { POST } from './route'
import { buildRequest } from '../../../../../__tests__/api'
import { _clearInMemoryRateLimitForTests } from '@/lib/utils/rateLimit'

const WEBHOOK_SECRET = 'test-webhook-secret-key'

describe('POST /api/webhooks/payment', () => {
	beforeAll(() => {
		process.env.PAYMENT_WEBHOOK_SECRET = WEBHOOK_SECRET
	})

	afterAll(() => {
		delete process.env.PAYMENT_WEBHOOK_SECRET
	})

	afterEach(() => {
		_clearInMemoryRateLimitForTests()
	})

	it('returns 503 when PAYMENT_WEBHOOK_SECRET is not configured', async () => {
		delete process.env.PAYMENT_WEBHOOK_SECRET
		const res = await POST(
			buildRequest('/api/webhooks/payment', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
			}),
		)
		expect(res.status).toBe(503)
		process.env.PAYMENT_WEBHOOK_SECRET = WEBHOOK_SECRET
	})

	it('returns 401 when Authorization is missing or invalid', async () => {
		const res = await POST(
			buildRequest('/api/webhooks/payment', {
				method: 'POST',
				body: JSON.stringify({}),
			}),
		)
		expect(res.status).toBe(401)

		const resBad = await POST(
			buildRequest('/api/webhooks/payment', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: { Authorization: 'Bearer wrong-secret' },
			}),
		)
		expect(resBad.status).toBe(401)
	})

	it('returns 400 when body fails validation', async () => {
		const res = await POST(
			buildRequest('/api/webhooks/payment', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: { Authorization: `Bearer ${WEBHOOK_SECRET}` },
			}),
		)
		expect(res.status).toBe(400)
		const body = await res.json()
		expect(body.ok).toBe(false)
	})
})
