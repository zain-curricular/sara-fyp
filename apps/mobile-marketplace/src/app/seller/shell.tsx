"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function SellerShell() {
	return (
		<div container-id="seller-shell" className="flex flex-col gap-8">
			<header container-id="seller-header" className="flex flex-col gap-2">
				<p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
					Seller dashboard
				</p>
				<h1 className="text-3xl font-semibold tracking-tight">Seller</h1>
				<p className="text-sm text-muted-foreground">
					Listings and seller tools will live here.
				</p>
			</header>
			<div container-id="seller-actions" className="flex flex-wrap gap-3">
				<Link className={cn(buttonVariants())} href="/seller/listings">
					My listings
				</Link>
				<Link
					className={cn(buttonVariants({ variant: "outline" }))}
					href="/seller/listings/new"
				>
					New listing
				</Link>
			</div>
		</div>
	);
}
