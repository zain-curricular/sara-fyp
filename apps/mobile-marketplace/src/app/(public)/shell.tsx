"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/primitives/button";
import { MARKETPLACE_PLATFORM } from "@/lib/features/marketplace";
import { cn } from "@/lib/utils";

export default function HomeShell() {
	return (
		<div container-id="home-shell" className="flex flex-col gap-12">
			<section
				container-id="home-hero"
				className="flex flex-col items-start gap-6 py-6 sm:py-10"
			>
				<p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
					{MARKETPLACE_PLATFORM} marketplace
				</p>
				<h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
					Browse phones
				</h1>
				<p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
					Foundation shell for the mobile marketplace — listings, auctions, and chat will plug in
					here. Sign in to sell or buy.
				</p>
				<div container-id="home-hero-cta" className="flex flex-wrap gap-3 pt-2">
					<Link className={cn(buttonVariants({ size: "lg" }))} href="/sign-in">
						Sign in
					</Link>
					<Link className={cn(buttonVariants({ size: "lg", variant: "outline" }))} href="/sign-up">
						Create account
					</Link>
				</div>
			</section>
			<section container-id="home-shortcuts" className="flex flex-col gap-4">
				<h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
					Shortcuts
				</h2>
				<div container-id="home-shortcut-grid" className="flex flex-wrap gap-3">
					<Link className={cn(buttonVariants({ variant: "outline" }))} href="/search">
						Search listings
					</Link>
					<Link className={cn(buttonVariants({ variant: "outline" }))} href="/seller">
						Seller dashboard
					</Link>
					<Link className={cn(buttonVariants({ variant: "outline" }))} href="/seller/listings">
						My listings
					</Link>
					<Link className={cn(buttonVariants({ variant: "outline" }))} href="/buyer">
						Buyer dashboard
					</Link>
				</div>
			</section>
		</div>
	);
}
