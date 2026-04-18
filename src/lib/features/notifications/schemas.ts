// ============================================================================
// Notifications — Zod request schemas
// ============================================================================

import { z } from 'zod'

export const notificationsMeQuerySchema = z
	.object({
		page: z.coerce.number().int().min(1).optional().default(1),
		limit: z.coerce.number().int().min(1).max(100).optional().default(20),
		unread_first: z
			.enum(['true', 'false'])
			.optional()
			.transform((v) => v === 'true'),
	})
	.strict()
