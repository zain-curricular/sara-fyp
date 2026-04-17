// ============================================================================
// Listings — images JSON schemas
// ============================================================================

import { z } from 'zod'

export const reorderListingImagesSchema = z
	.object({
		image_ids: z.array(z.string().uuid()).min(1).max(10),
	})
	.strict()
