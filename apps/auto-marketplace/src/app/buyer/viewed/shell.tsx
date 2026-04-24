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
		<div container-id="viewed-shell" className="flex flex-col gap-8">
			<header container-id="viewed-header" className="flex flex-wrap items-end justify-between gap-3">
				<div className="flex flex-col gap-1">
					<h1 className="text-3xl font-semibold tracking-tight">Recently viewed</h1>
					<p className="text-sm text-muted-foreground">
						Parts you opened while signed in
						{pagination.total > 0 ? ` (${pagination.total})` : ""}.
					</p>
				</div>
				<Link href="/buyer/favorites" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
					Favorites
				</Link>
			</header>

			{items.length === 0 ? (
				<div
					container-id="viewed-empty"
					className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center"
				>
					<p className="text-sm font-medium">No history yet.</p>
					<p className="text-xs text-muted-foreground">
						<Link href="/search" className="text-primary underline-offset-4 hover:underline">
							Browse parts
						</Link>{" "}
						to start building history.
					</p>
				</div>
			) : (
				<div
					container-id="viewed-grid"
					className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
				>
					{items.map((row) => (
						<div key={row.listing.id} className="flex flex-col gap-2">
							<ListingCard listing={row.listing} />
							<p className="px-1 text-xs text-muted-foreground">
								Viewed {formatViewedAt(row.viewed_at)}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
