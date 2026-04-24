// ============================================================================
// Messaging — Schemas
// ============================================================================
//
// Zod v4 schemas for the messaging API request bodies. Used in API route
// validation and inferred as TypeScript types for client hooks.

import { z } from "zod";

/** Body for POST /api/conversations/[id]/messages — send a message. */
export const sendMessageSchema = z.object({
	body: z.string().min(1).max(5000),
	attachments: z.array(z.string().url()).max(10).default([]),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/** Body for POST /api/conversations — get-or-create a conversation. */
export const startConversationSchema = z.object({
	sellerId: z.string().uuid(),
	listingId: z.string().uuid().optional(),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;
