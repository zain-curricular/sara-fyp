// ============================================================================
// Device testing — request body schemas (Zod)
// ============================================================================

import { z } from 'zod'

export const createTestReportBodySchema = z
	.object({
		order_id: z.string().uuid(),
	})
	.strict()

export const patchTestReportBodySchema = z
	.object({
		inspection_results: z.record(z.string(), z.any()).optional(),
		overall_score: z.number().int().min(1).max(10).optional(),
		overall_notes: z.string().max(10_000).optional().nullable(),
	})
	.strict()

export const submitTestReportBodySchema = z
	.object({
		overall_score: z.number().int().min(1).max(10),
		overall_notes: z.string().max(10_000).optional().nullable(),
		passed: z.boolean(),
	})
	.strict()

export const assignTesterBodySchema = z
	.object({
		order_id: z.string().uuid(),
		tester_id: z.string().uuid(),
	})
	.strict()
