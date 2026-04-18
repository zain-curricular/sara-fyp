// ============================================================================
// ReviewForm
// ============================================================================
//
// Buyer-facing form to submit a star rating and optional comment after an order.
// Posts via useSubmitReview and navigates back to /buyer on success.
//
// Layout
// ------
// Uses Field primitives for the rating row (custom slider + FieldDescription)
// and the comment field. The rating label uses onClick + ref focus because
// <label htmlFor> does not associate reliably with div[role="slider"].
//


"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { postReviewSchema, useSubmitReview } from "@/lib/features/reviews";
import { ReviewStars } from "@/components/reviews/review-stars";
import { Button } from "@/components/primitives/button";
import {
	Field,
	FieldDescription,
	FieldLabel,
} from "@/components/primitives/field";
import { Textarea } from "@/components/primitives/textarea";

type ReviewFormProps = {
	orderId: string;
};

/**
 * Form for submitting a review for a completed order (rating + optional comment).
 *
 * @param props.orderId - Order id to attach the review to.
 * @returns The review form element tree.
 */
export function ReviewForm({ orderId }: ReviewFormProps) {
	const router = useRouter();
	const submitReview = useSubmitReview();
	const ratingSliderRef = useRef<HTMLDivElement>(null);
	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState("");
	const [isPending, setIsPending] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		const parsed = postReviewSchema.safeParse({
			order_id: orderId,
			rating,
			comment: comment.trim() === "" ? null : comment.trim(),
		});
		if (!parsed.success) {
			toast.error("Choose a star rating (1–5).");
			return;
		}

		setIsPending(true);
		const result = await submitReview(parsed.data);
		setIsPending(false);

		if (result.ok) {
			toast.success("Thanks — your review was submitted.");
			router.push("/buyer");
			return;
		}

		toast.error(result.error);
	}

	return (
		<form className="flex max-w-lg flex-col gap-6" onSubmit={(e) => void onSubmit(e)}>
			<Field className="space-y-2">
				<FieldLabel
					id="review-rating-label"
					className="w-fit cursor-pointer"
					onClick={() => ratingSliderRef.current?.focus()}
				>
					Rating
				</FieldLabel>
				<ReviewStars
					ref={ratingSliderRef}
					id="review-rating-control"
					labelId="review-rating-label"
					value={rating}
					onChange={setRating}
					ariaDescribedBy="review-rating-hint"
				/>
				<FieldDescription id="review-rating-hint" className="text-xs">
					Required — tap a star or focus this control and use arrow keys (left/right) to choose 1–5. Home and
					End jump to 1 and 5.
				</FieldDescription>
			</Field>
			<Field className="space-y-2">
				<FieldLabel htmlFor="review-comment">Comment (optional)</FieldLabel>
				<Textarea
					id="review-comment"
					maxLength={1000}
					placeholder="Share your experience with the seller…"
					value={comment}
					onChange={(ev) => setComment(ev.target.value)}
					rows={5}
				/>
			</Field>
			<Button type="submit" disabled={isPending || rating < 1}>
				{isPending ? "Submitting…" : "Submit review"}
			</Button>
		</form>
	);
}
