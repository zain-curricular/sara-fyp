// ============================================================================
// Unit tests — orders Zod schemas
// ============================================================================

import { describe, it, expect } from 'vitest'

import {
	orderPayBodySchema,
	orderPaymentWebhookBodySchema,
	transitionOrderBodySchema,
} from '@/lib/features/orders/schemas'

describe('transitionOrderBodySchema', () => {
	it('accepts metadata', () => {
		const p = transitionOrderBodySchema.safeParse({
			new_status: 'delivered',
			metadata: { note: 'ok' },
		})
		expect(p.success).toBe(true)
	})
})

describe('orderPayBodySchema', () => {
	it('accepts a payment method', () => {
		const p = orderPayBodySchema.safeParse({ payment_method: 'stripe' })
		expect(p.success).toBe(true)
	})
})

describe('orderPaymentWebhookBodySchema', () => {
	it('accepts completed', () => {
		const p = orderPaymentWebhookBodySchema.safeParse({
			escrow_transaction_id: '00000000-0000-4000-8000-000000000001',
			status: 'completed',
		})
		expect(p.success).toBe(true)
	})
})
