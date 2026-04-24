/** Client barrel — hooks & schemas. Server: `@/lib/features/reviews/services`. */

export type { PostReviewInput, ReviewsListQuery } from "./schemas";
export { postReviewSchema, reviewsListQuerySchema } from "./schemas";

export type { OrderDetailForReview, OrderRowSummary, ReviewRecord, ReviewsListPayload } from "./types";

export { profileReviewsNextPage, profileReviewsQuery } from "./query";

export {
	useSellerReviews,
	useSubmitReview,
	type SellerReviewsBundle,
	type SubmitReviewResult,
} from "./hooks";
