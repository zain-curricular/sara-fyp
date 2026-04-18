import { z } from "zod";

/** URL/search params for `/search` (mirrors marketplace `listingsSearchQuerySchema`). */
export const listingsSearchParamsSchema = z
	.object({
		q: z.string().max(80).optional(),
		platform: z.enum(["mobile", "automotive"]).optional(),
		category_id: z.string().uuid().optional(),
		model_id: z.string().uuid().optional(),
		city: z.string().max(120).optional(),
		price_min: z.coerce.number().positive().optional(),
		price_max: z.coerce.number().positive().optional(),
		page: z.coerce.number().int().min(1).max(100).optional(),
		limit: z.coerce.number().int().min(1).max(50).optional(),
	})
	.strict();

export type ListingsSearchParams = z.infer<typeof listingsSearchParamsSchema>;

/** Minimal draft payload for the create wizard (matches remote API body shape). */
export const createListingWizardSchema = z
	.object({
		platform: z.literal("mobile"),
		category_id: z.string().uuid(),
		model_id: z.string().uuid().nullable().optional(),
		title: z.string().min(1).max(200),
		description: z.string().max(20000).nullable().optional(),
		sale_type: z.enum(["fixed", "auction", "both"]),
		price: z.number().positive(),
		is_negotiable: z.boolean().optional(),
		condition: z.enum(["new", "like_new", "excellent", "good", "fair", "poor"]),
		details: z.record(z.string(), z.unknown()).default({}),
		city: z.string().min(1).max(120),
		area: z.string().max(120).nullable().optional(),
	})
	.strict();

export type CreateListingWizardInput = z.infer<typeof createListingWizardSchema>;
