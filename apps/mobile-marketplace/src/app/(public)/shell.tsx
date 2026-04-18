"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/primitives/button";
import { MARKETPLACE_PLATFORM } from "@/lib/features/marketplace";
import { cn } from "@/lib/utils";

export default function HomeShell() {
	return (
		<div className="flex flex-col gap-8">
			<div className="space-y-3">
				<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					{MARKETPLACE_PLATFORM} marketplace
				</p>
				<h1 className="text-3xl font-semibold tracking-tight">Browse phones</h1>
				<p className="max-w-xl text-muted-foreground">
					Foundation shell for the mobile marketplace — listings, auctions, and chat will plug in
					here. Sign in to sell or buy.
				</p>
			</div>
			<div className="flex flex-wrap gap-3">
				<Link className={cn(buttonVariants())} href="/sign-in">
					Sign in
				</Link>
				<Link className={cn(buttonVariants({ variant: "outline" }))} href="/sign-up">
					Sign up
				</Link>
				<Link className={cn(buttonVariants({ variant: "outline" }))} href="/seller">
					Seller dashboard
				</Link>
				<Link className={cn(buttonVariants({ variant: "outline" }))} href="/buyer">
					Buyer dashboard
				</Link>
			</div>
		</div>
	);
}
