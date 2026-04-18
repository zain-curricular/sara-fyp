"use client";

import type { ReviewRecord } from "@/lib/features/reviews";
import { Card, CardContent } from "@/components/primitives/card";
import { ReviewStars } from "@/components/reviews/review-stars";

type ReviewCardProps = {
	review: ReviewRecord;
};

function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
	} catch {
		return iso;
	}
}

export function ReviewCard({ review }: ReviewCardProps) {
	return (
		<Card size="sm">
			<CardContent className="flex flex-col gap-2 pt-4">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<ReviewStars value={review.rating} readOnly />
					<span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
				</div>
				{review.comment ? (
					<p className="text-sm text-muted-foreground">{review.comment}</p>
				) : (
					<p className="text-sm italic text-muted-foreground">No written feedback.</p>
				)}
			</CardContent>
		</Card>
	);
}
