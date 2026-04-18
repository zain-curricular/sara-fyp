"use client";

import Link from "next/link";

import type { ListingImageRecord, ListingRecord } from "@/lib/features/listings";
import { ListingDetailGallery } from "@/components/listings/listing-detail-gallery";
import { ListingSpecsTable } from "@/components/listings/listing-specs-table";
import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { cn } from "@/lib/utils";

type ListingDetailShellProps = {
	listing: ListingRecord;
	images: ListingImageRecord[];
};

export default function ListingDetailShell({ listing, images }: ListingDetailShellProps) {
	return (
		<div className="flex flex-col gap-8">
			<div className="space-y-2">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="secondary">{listing.status}</Badge>
					<Badge variant="secondary">{listing.condition}</Badge>
					<Badge variant="secondary">{listing.sale_type}</Badge>
				</div>
				<h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
				<p className="text-3xl font-semibold tabular-nums">${listing.price.toLocaleString()}</p>
				<p className="text-sm text-muted-foreground">{listing.city}</p>
			</div>

			<ListingDetailGallery images={images} title={listing.title} />

			<Card size="sm">
				<CardHeader>
					<CardTitle className="text-base">Description</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="whitespace-pre-wrap text-sm text-muted-foreground">
						{listing.description ?? "No description."}
					</p>
				</CardContent>
			</Card>

			<ListingSpecsTable listing={listing} />

			<div className="flex flex-wrap gap-3">
				<Button type="button" disabled>
					Buy now (escrow)
				</Button>
				<Button type="button" variant="outline" disabled>
					Place bid
				</Button>
				<Link href="/search" className={cn(buttonVariants({ variant: "outline" }))}>
					Back to search
				</Link>
			</div>
		</div>
	);
}
