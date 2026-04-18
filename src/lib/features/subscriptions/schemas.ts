// ============================================================================
// Subscriptions — Zod schemas (API boundary)
// ============================================================================

import { z } from 'zod'

export const subscriptionCheckoutBodySchema = z
	.object({
		target_tier: z.enum(['premium', 'wholesale']),
	})
	.strict()

export type SubscriptionCheckoutBody = z.infer<typeof subscriptionCheckoutBodySchema>

export const adminCreateSubscriptionSchema = z
	.object({
		user_id: z.string().uuid(),
		tier: z.enum(['free', 'premium', 'wholesale']),
		expires_at: z.string().datetime({ offset: true }).optional().nullable(),
		max_active_listings: z.number().int().min(1).max(500).optional(),
		max_featured_listings: z.number().int().min(0).max(100).optional(),
	})
	.strict()

export type AdminCreateSubscriptionInput = z.infer<typeof adminCreateSubscriptionSchema>

export const adminPatchSubscriptionSchema = z
	.object({
		tier: z.enum(['free', 'premium', 'wholesale']).optional(),
		expires_at: z.string().datetime({ offset: true }).optional().nullable(),
		is_active: z.boolean().optional(),
		max_active_listings: z.number().int().min(1).max(500).optional(),
		max_featured_listings: z.number().int().min(0).max(100).optional(),
	})
	.strict()

export type AdminPatchSubscriptionInput = z.infer<typeof adminPatchSubscriptionSchema>

export const paymentWebhookBodySchema = z
	.object({
		escrow_transaction_id: z.string().uuid(),
		external_tx_id: z.string().optional(),
		status: z.enum(['completed', 'failed']),
	})
	.strict()

export type PaymentWebhookBody = z.infer<typeof paymentWebhookBodySchema>

/** Metadata for subscription checkout escrow rows (`escrow_transactions.metadata`). */
export const subscriptionEscrowMetadataSchema = z
	.object({
		kind: z.literal('subscription'),
		user_id: z.string().uuid(),
		target_tier: z.enum(['premium', 'wholesale']),
	})
	.strict()

export type SubscriptionEscrowMetadata = z.infer<typeof subscriptionEscrowMetadataSchema>
