import { z } from "zod";
import { uuid } from "@/lib/validation/uuid";

export const postReviewSchema = z
	.object({
		order_id: uuid(),
		rating: z.number().int().min(1).max(5),
		comment: z.string().max(1000).optional().nullable(),
	})
	.strict();

export type PostReviewInput = z.infer<typeof postReviewSchema>;

export const reviewsListQuerySchema = z
	.object({
		page: z.coerce.number().int().min(1).max(10_000).default(1),
		limit: z.coerce.number().int().min(1).max(50).default(20),
	})
	.strict();

export type ReviewsListQuery = z.infer<typeof reviewsListQuerySchema>;
