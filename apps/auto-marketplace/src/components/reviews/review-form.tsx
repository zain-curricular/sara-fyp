// ============================================================================
// ReviewForm
// ============================================================================
//
// Buyer-facing form to submit a star rating and optional comment after an order.
// Quick-tag chips append their label to the comment for one-tap feedback.
// Posts via useSubmitReview and navigates to /buyer on success.

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { postReviewSchema, useSubmitReview } from "@/lib/features/reviews";
import { ReviewStars } from "@/components/reviews/review-stars";
import { Button } from "@/components/primitives/button";
import { Field, FieldDescription, FieldLabel } from "@/components/primitives/field";
import { Textarea } from "@/components/primitives/textarea";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const QUICK_TAGS = [
	"As described",
	"Fast shipping",
	"Great comms",
	"Easy transaction",
	"Well packaged",
] as const;

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type ReviewFormProps = {
	orderId: string;
};

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

/**
 * Form for submitting a review for a completed order (rating + optional comment).
 *
 * @param props.orderId - Order ID to attach the review to.
 */
export function ReviewForm({ orderId }: ReviewFormProps) {
	const router = useRouter();
	const submitReview = useSubmitReview();
	const ratingSliderRef = useRef<HTMLDivElement>(null);
	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState("");
	const [isPending, setIsPending] = useState(false);

	function applyTag(tag: string) {
		setComment((prev) => {
			const trimmed = prev.trim();
			if (trimmed.includes(tag)) return prev;
			return trimmed ? `${trimmed}. ${tag}` : tag;
		});
	}

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
		<form
			className="flex w-full flex-col gap-6"
			container-id="review-form"
			aria-label="Submit review"
			onSubmit={(e) => void onSubmit(e)}
		>
			{/* Star rating */}
			<Field className="space-y-2" data-invalid={false}>
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
					Required — tap a star or use arrow keys to choose 1–5.
				</FieldDescription>
			</Field>

			{/* Quick-tag chips */}
			<div className="flex flex-col gap-2">
				<p className="text-sm font-medium">Quick tags</p>
				<div className="flex flex-wrap gap-2">
					{QUICK_TAGS.map((tag) => {
						const active = comment.includes(tag);
						return (
							<button
								key={tag}
								type="button"
								onClick={() => applyTag(tag)}
								className={cn(
									"rounded-full border px-3 py-1 text-xs font-medium transition-colors",
									active
										? "border-primary bg-primary/10 text-primary"
										: "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
								)}
							>
								{active ? "✓ " : ""}{tag}
							</button>
						);
					})}
				</div>
			</div>

			{/* Comment */}
			<Field className="space-y-2" data-invalid={false}>
				<FieldLabel htmlFor="review-comment">Comment (optional)</FieldLabel>
				<Textarea
					id="review-comment"
					maxLength={1000}
					placeholder="Share your experience with the seller…"
					value={comment}
					onChange={(ev) => setComment(ev.target.value)}
					rows={4}
				/>
			</Field>

			<Button type="submit" disabled={isPending || rating < 1} className="w-full sm:w-fit">
				{isPending ? "Submitting…" : "Submit review"}
			</Button>
		</form>
	);
}
