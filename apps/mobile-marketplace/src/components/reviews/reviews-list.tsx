"use client";

import { useSellerReviews, type SellerReviewsBundle } from "@/lib/features/reviews";
import { ReviewCard } from "@/components/reviews/review-card";
import { Button } from "@/components/primitives/button";

type ReviewsListProps = {
	sellerId: string;
	initial: SellerReviewsBundle;
	emptyMessage?: string;
};

export function ReviewsList({
	sellerId,
	initial,
	emptyMessage = "No reviews yet.",
}: ReviewsListProps) {
	const { items, loadMore, hasMore, loading, loadMoreError } = useSellerReviews(sellerId, initial);

	if (items.length === 0) {
		return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
	}

	return (
		<div container-id="reviews-list" className="flex flex-col gap-4">
			{items.map((review) => (
				<ReviewCard key={review.id} review={review} />
			))}
			{hasMore ? (
				<div container-id="reviews-load-more" className="flex flex-col items-center gap-2 pt-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={loading}
						onClick={() => void loadMore()}
					>
						{loading ? "Loading…" : "Load more"}
					</Button>
					{loadMoreError ? (
						<p className="text-sm text-destructive" role="status" aria-live="polite">
							{loadMoreError}
						</p>
					) : null}
				</div>
			) : null}
		</div>
	);
}
