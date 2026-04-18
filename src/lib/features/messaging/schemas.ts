// ============================================================================
// Messaging — Zod request schemas (mirror DB CHECK: content 1–5000)
// ============================================================================

import { z } from 'zod'

export const createConversationBodySchema = z
	.object({
		listing_id: z.string().uuid(),
	})
	.strict()

export const sendMessageBodySchema = z
	.object({
		content: z.string().min(1).max(5000),
	})
	.strict()

export const conversationsMeQuerySchema = z.object({
	page: z.coerce.number().int().min(1).optional().default(1),
	limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export const messagesListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).optional().default(1),
	limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})
