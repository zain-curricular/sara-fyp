"use client";

import Link from "next/link";

import type { ListingRecord } from "@/lib/features/listings";
import { ListingCard } from "@/components/listings/listing-card";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

type SellerListingsShellProps = {
	listings: ListingRecord[];
};

export default function SellerListingsShell({ listings }: SellerListingsShellProps) {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">My listings</h1>
					<p className="text-sm text-muted-foreground">Manage drafts and published phones.</p>
				</div>
				<Link href="/seller/listings/new" className={cn(buttonVariants())}>
					New listing
				</Link>
			</div>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{listings.map((l) => (
					<div key={l.id} className="flex flex-col gap-2">
						<ListingCard listing={l} />
						<Link
							href={`/seller/listings/${l.id}/edit`}
							className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
						>
							Edit
						</Link>
					</div>
				))}
			</div>

			{listings.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No listings yet.{" "}
					<Link href="/seller/listings/new" className="text-primary underline">
						Create one
					</Link>
					.
				</p>
			) : null}
		</div>
	);
}
