// ============================================================================
// Orders & escrow — Zod schemas (API boundary)
// ============================================================================

import { z } from 'zod'

export const transitionOrderBodySchema = z
	.object({
		new_status: z.enum([
			'awaiting_payment',
			'payment_received',
			'shipped_to_center',
			'under_testing',
			'testing_complete',
			'approved',
			'rejected',
			'shipped_to_buyer',
			'delivered',
			'completed',
			'cancelled',
			'refunded',
		]),
		metadata: z.record(z.string(), z.unknown()).optional().default({}),
	})
	.strict()

export type TransitionOrderBody = z.infer<typeof transitionOrderBodySchema>

export const orderPayBodySchema = z
	.object({
		payment_method: z.enum(['jazzcash', 'easypaisa', 'stripe', 'bank_transfer']),
	})
	.strict()

export type OrderPayBody = z.infer<typeof orderPayBodySchema>

export const orderPaymentWebhookBodySchema = z
	.object({
		escrow_transaction_id: z.string().uuid(),
		external_tx_id: z.string().nullable().optional(),
		status: z.enum(['completed', 'failed']),
	})
	.strict()

export type OrderPaymentWebhookBody = z.infer<typeof orderPaymentWebhookBodySchema>
