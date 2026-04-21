"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function BuyerShell() {
	return (
		<div container-id="buyer-shell" className="flex flex-col gap-8">
			<header container-id="buyer-header" className="flex flex-col gap-2">
				<p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
					Buyer dashboard
				</p>
				<h1 className="text-3xl font-semibold tracking-tight">Buyer</h1>
				<p className="text-sm text-muted-foreground">
					Saved listings and account shortcuts.
				</p>
			</header>

			<div container-id="buyer-actions" className="flex flex-wrap gap-3">
				<Link className={cn(buttonVariants())} href="/buyer/favorites">
					Favorites
				</Link>
				<Link className={cn(buttonVariants({ variant: "outline" }))} href="/buyer/viewed">
					Recently viewed
				</Link>
				<Link
					className={cn(buttonVariants({ variant: "outline" }))}
					href="/buyer/settings/profile"
				>
					Settings
				</Link>
			</div>

			<p container-id="buyer-help" className="text-xs text-muted-foreground">
				When an order is completed, open your review link from order details (buyer → orders →
				review).
			</p>
		</div>
	);
}
