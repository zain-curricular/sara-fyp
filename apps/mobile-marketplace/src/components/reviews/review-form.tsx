"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { postReviewSchema, useSubmitReview } from "@/lib/features/reviews";
import { ReviewStars } from "@/components/reviews/review-stars";
import { Button } from "@/components/primitives/button";
import { Label } from "@/components/primitives/label";
import { Textarea } from "@/components/primitives/textarea";

type ReviewFormProps = {
	orderId: string;
};

export function ReviewForm({ orderId }: ReviewFormProps) {
	const router = useRouter();
	const submitReview = useSubmitReview();
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
			<div className="space-y-2">
				<Label>Rating</Label>
				<ReviewStars value={rating} onChange={setRating} />
				<p className="text-xs text-muted-foreground">Required — tap a star from 1 to 5.</p>
			</div>
			<div className="space-y-2">
				<Label htmlFor="review-comment">Comment (optional)</Label>
				<Textarea
					id="review-comment"
					maxLength={1000}
					placeholder="Share your experience with the seller…"
					value={comment}
					onChange={(ev) => setComment(ev.target.value)}
					rows={5}
				/>
			</div>
			<Button type="submit" disabled={isPending || rating < 1}>
				{isPending ? "Submitting…" : "Submit review"}
			</Button>
		</form>
	);
}
