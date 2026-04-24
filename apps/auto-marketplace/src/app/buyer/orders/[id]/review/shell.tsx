"use client";

import Link from "next/link";

import { ReviewForm } from "@/components/reviews/review-form";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

type BuyerOrderReviewShellProps =
	| { mode: "form"; orderId: string }
	| { mode: "not_completed"; orderId: string };

export default function BuyerOrderReviewShell(props: BuyerOrderReviewShellProps) {
	if (props.mode === "not_completed") {
		return (
			<div
				container-id="review-unavailable"
				className="mx-auto flex max-w-lg flex-col gap-4 rounded-2xl border border-border bg-card p-8 shadow-sm"
			>
				<h1 className="text-2xl font-semibold tracking-tight">Review unavailable</h1>
				<p className="text-sm text-muted-foreground">
					You can leave a review once this order is marked <strong>completed</strong>.
				</p>
				<Link href="/buyer" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
					Back to buyer home
				</Link>
			</div>
		);
	}

	return (
		<div container-id="buyer-review-shell" className="mx-auto flex max-w-2xl flex-col gap-8">
			<header className="flex flex-col gap-2">
				<h1 className="text-3xl font-semibold tracking-tight">Rate your seller</h1>
				<p className="text-sm text-muted-foreground">
					Share a star rating and optional feedback. You cannot edit this after submitting.
				</p>
			</header>
			<div
				container-id="buyer-review-form-card"
				className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
			>
				<ReviewForm orderId={props.orderId} />
			</div>
			<Link
				href="/buyer"
				className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit")}
			>
				Cancel
			</Link>
		</div>
	);
}
