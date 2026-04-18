"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function BuyerShell() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight">Buyer</h1>
				<p className="text-muted-foreground">Saved listings and account shortcuts.</p>
			</div>
			<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
				<Link className={cn(buttonVariants(), "w-fit")} href="/buyer/favorites">
					Favorites
				</Link>
				<Link className={cn(buttonVariants({ variant: "outline" }), "w-fit")} href="/buyer/viewed">
					Recently viewed
				</Link>
				<p className="text-xs text-muted-foreground">
					When an order is completed, open your review link from order details (path: buyer → orders → review).
				</p>
				<Link
					className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
					href="/buyer/settings/profile"
				>
					Settings
				</Link>
			</div>
		</div>
	);
}
