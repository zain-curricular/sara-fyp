// ============================================================================
// 404 Not Found
// ============================================================================
//
// Global not-found page. Shown by Next.js when no route matches.
// Friendly message with a search bar and links to /browse and /.

import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { Button, buttonVariants } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Page not found — ShopSmart",
};

export default function NotFound() {
	return (
		<div
			container-id="not-found"
			className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4 text-center"
		>

			{/* Status code */}
			<p
				container-id="not-found-code"
				className="text-8xl font-black tracking-tighter text-muted-foreground/20 select-none"
			>
				404
			</p>

			{/* Heading + description */}
			<div container-id="not-found-copy" className="-mt-4 flex flex-col gap-2">
				<h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
				<p className="max-w-xs text-sm text-muted-foreground">
					The page you're looking for doesn't exist or has been moved.
				</p>
			</div>

			{/* Search bar */}
			<form
				container-id="not-found-search"
				action="/search"
				method="get"
				className="flex w-full max-w-sm gap-2"
			>
				<div className="relative flex-1">
					<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						name="q"
						placeholder="Search parts, brands, vehicles…"
						className="pl-9"
						autoComplete="off"
					/>
				</div>
				<Button type="submit" variant="outline">
					Search
				</Button>
			</form>

			{/* Quick links */}
			<div container-id="not-found-links" className="flex flex-wrap justify-center gap-3">
				<Link href="/" className={cn(buttonVariants())}>
					Go home
				</Link>
				<Link href="/browse" className={cn(buttonVariants({ variant: "outline" }))}>
					Browse parts
				</Link>
			</div>

		</div>
	);
}
