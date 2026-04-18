// ============================================================================
// Admin Panel — Zod (moderation + analytics query/body)
// ============================================================================

import { z } from 'zod'

import { ADMIN_MODERATION_LIST_MAX } from './config'

const daysField = z.coerce.number().int().refine((d) => [7, 30, 90].includes(d), {
	message: 'days must be 7, 30, or 90',
})

export const adminModerationReportsQuerySchema = z.object({
	status: z.enum(['pending', 'reviewed', 'resolved', 'dismissed']).optional(),
	limit: z.coerce.number().int().min(1).max(ADMIN_MODERATION_LIST_MAX).default(20),
	offset: z.coerce.number().int().min(0).max(10_000).default(0),
})

export const adminResolveReportBodySchema = z
	.object({
		status: z.enum(['reviewed', 'resolved', 'dismissed']),
	})
	.strict()

export const adminAnalyticsWindowQuerySchema = z.object({
	days: daysField.default(30),
})

export type AdminModerationReportsQuery = z.infer<typeof adminModerationReportsQuerySchema>
export type AdminResolveReportBody = z.infer<typeof adminResolveReportBodySchema>
export type AdminAnalyticsWindowQuery = z.infer<typeof adminAnalyticsWindowQuerySchema>
