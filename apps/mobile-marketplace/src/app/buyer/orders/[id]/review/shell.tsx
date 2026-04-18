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
			<div className="flex max-w-lg flex-col gap-4">
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
		<div className="flex flex-col gap-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">Rate your seller</h1>
				<p className="text-sm text-muted-foreground">
					Share a star rating and optional feedback. You cannot edit this after submitting.
				</p>
			</div>
			<ReviewForm orderId={props.orderId} />
			<Link href="/buyer" className={cn(buttonVariants({ variant: "ghost" }), "w-fit text-sm")}>
				Cancel
			</Link>
		</div>
	);
}
