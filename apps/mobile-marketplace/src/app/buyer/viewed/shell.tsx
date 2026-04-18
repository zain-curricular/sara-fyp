"use client";

import Link from "next/link";

import type { ViewedListPayload } from "@/lib/features/favorites";
import { ListingCard } from "@/components/listings/listing-card";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

type ViewedShellProps = {
	payload: ViewedListPayload;
};

function formatViewedAt(iso: string): string {
	try {
		return new Date(iso).toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		});
	} catch {
		return iso;
	}
}

export default function ViewedShell({ payload }: ViewedShellProps) {
	const { items, pagination } = payload;

	return (
		<div className="flex flex-col gap-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">Recently viewed</h1>
				<p className="text-sm text-muted-foreground">
					Listings you opened while signed in{pagination.total > 0 ? ` (${pagination.total})` : ""}.
				</p>
			</div>

			{items.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No history yet.{" "}
					<Link href="/search" className="text-primary underline">
						Browse listings
					</Link>
					.
				</p>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{items.map((row) => (
						<div key={row.listing.id} className="flex flex-col gap-1.5">
							<ListingCard listing={row.listing} />
							<p className="px-1 text-xs text-muted-foreground">Viewed {formatViewedAt(row.viewed_at)}</p>
						</div>
					))}
				</div>
			)}

			<Link href="/buyer/favorites" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
				Favorites
			</Link>
		</div>
	);
}
