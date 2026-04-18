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
		<div className="flex flex-col gap-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
				<p className="text-sm text-muted-foreground">
					Listings you have saved{pagination.total > 0 ? ` (${pagination.total})` : ""}.
				</p>
			</div>

			{items.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No favorites yet.{" "}
					<Link href="/search" className="text-primary underline">
						Browse listings
					</Link>
					.
				</p>
			) : (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{items.map((row) => (
						<ListingCard key={row.listing.id} listing={row.listing} />
					))}
				</div>
			)}

			<Link href="/buyer/viewed" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
				Recently viewed
			</Link>
		</div>
	);
}
