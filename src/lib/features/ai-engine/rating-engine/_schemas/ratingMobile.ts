// ============================================================================
// Rating Engine — structured output schema (mobile / electronics)
// ============================================================================

import { z } from 'zod'

const score = z.number().int().min(1).max(10)

export const ratingMobileBreakdownSchema = z
	.object({
		screen: score,
		battery: score,
		camera: score,
		motherboard: score,
		sensors: score,
	})
	.strict()

export const ratingMobileOutputSchema = z
	.object({
		overall: score,
		summary: z.string().min(1).max(2000),
		pros: z.array(z.string().max(500)).max(20),
		cons: z.array(z.string().max(500)).max(20),
		breakdown: ratingMobileBreakdownSchema,
	})
	.strict()

export type RatingMobileOutput = z.infer<typeof ratingMobileOutputSchema>
