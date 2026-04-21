"use client";

import Link from "next/link";

import type { FavoritesListPayload } from "@/lib/features/favorites";
import { ListingCard } from "@/components/listings/listing-card";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

type FavoritesShellProps = {
	payload: FavoritesListPayload;
};

export default function FavoritesShell({ payload }: FavoritesShellProps) {
	const { items, pagination } = payload;

	return (
		<div container-id="favorites-shell" className="flex flex-col gap-8">
			<header container-id="favorites-header" className="flex flex-wrap items-end justify-between gap-3">
				<div className="flex flex-col gap-1">
					<h1 className="text-3xl font-semibold tracking-tight">Favorites</h1>
					<p className="text-sm text-muted-foreground">
						Listings you have saved{pagination.total > 0 ? ` (${pagination.total})` : ""}.
					</p>
				</div>
				<Link
					href="/buyer/viewed"
					className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
				>
					Recently viewed
				</Link>
			</header>

			{items.length === 0 ? (
				<div
					container-id="favorites-empty"
					className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center"
				>
					<p className="text-sm font-medium">No favorites yet.</p>
					<p className="text-xs text-muted-foreground">
						<Link href="/search" className="text-primary underline-offset-4 hover:underline">
							Browse listings
						</Link>{" "}
						to save your first one.
					</p>
				</div>
			) : (
				<div
					container-id="favorites-grid"
					className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
				>
					{items.map((row) => (
						<ListingCard key={row.listing.id} listing={row.listing} />
					))}
				</div>
			)}
		</div>
	);
}
