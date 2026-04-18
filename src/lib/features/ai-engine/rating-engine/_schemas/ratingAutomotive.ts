// ============================================================================
// Rating Engine — structured output schema (automotive)
// ============================================================================

import { z } from 'zod'

const score = z.number().int().min(1).max(10)

export const ratingAutomotiveBreakdownSchema = z
	.object({
		engine: score,
		transmission: score,
		body: score,
		electrical: score,
		comfort: score,
	})
	.strict()

export const ratingAutomotiveOutputSchema = z
	.object({
		overall: score,
		summary: z.string().min(1).max(2000),
		pros: z.array(z.string().max(500)).max(20),
		cons: z.array(z.string().max(500)).max(20),
		breakdown: ratingAutomotiveBreakdownSchema,
	})
	.strict()

export type RatingAutomotiveOutput = z.infer<typeof ratingAutomotiveOutputSchema>
