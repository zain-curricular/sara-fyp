"use client";

import Link from "next/link";

import type { ListingImageRecord, ListingRecord } from "@/lib/features/listings";
import type { ReviewsListPayload } from "@/lib/features/reviews/types";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { RecordListingView } from "@/components/favorites/record-listing-view";
import { ListingDetailGallery } from "@/components/listings/listing-detail-gallery";
import { ReviewsList } from "@/components/reviews/reviews-list";
import { ListingSpecsTable } from "@/components/listings/listing-specs-table";
import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { cn } from "@/lib/utils";

type ListingDetailShellProps = {
	listing: ListingRecord;
	images: ListingImageRecord[];
	sellerReviews: ReviewsListPayload;
};

export default function ListingDetailShell({ listing, images, sellerReviews }: ListingDetailShellProps) {
	return (
		<div container-id="listing-detail-shell" className="flex flex-col gap-10">
			<RecordListingView listingId={listing.id} />

			<header container-id="listing-detail-header" className="flex flex-col gap-4">
				<div container-id="listing-detail-meta" className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">{listing.status}</Badge>
						<Badge variant="secondary">{listing.condition}</Badge>
						<Badge variant="secondary">{listing.sale_type}</Badge>
					</div>
					<FavoriteButton listingId={listing.id} />
				</div>
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
						{listing.title}
					</h1>
					<p className="text-3xl font-semibold tabular-nums sm:text-4xl">
						${listing.price.toLocaleString()}
					</p>
					<p className="text-sm text-muted-foreground">{listing.city}</p>
				</div>
			</header>

			<div
				container-id="listing-detail-grid"
				className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10"
			>
				<div container-id="listing-detail-main" className="flex min-w-0 flex-col gap-8">
					<ListingDetailGallery images={images} title={listing.title} />

					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Description</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
								{listing.description ?? "No description."}
							</p>
						</CardContent>
					</Card>

					<ListingSpecsTable listing={listing} />

					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Seller reviews</CardTitle>
						</CardHeader>
						<CardContent>
							<ReviewsList
								key={listing.user_id}
								sellerId={listing.user_id}
								initial={sellerReviews}
								emptyMessage="This seller has no reviews yet."
							/>
						</CardContent>
					</Card>
				</div>

				<aside
					container-id="listing-detail-side"
					className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start"
				>
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Take action</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-2">
							<Button type="button" disabled>
								Buy now (escrow)
							</Button>
							<Button type="button" variant="outline" disabled>
								Place bid
							</Button>
							<Link
								href="/search"
								className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full")}
							>
								Back to search
							</Link>
						</CardContent>
					</Card>
				</aside>
			</div>
		</div>
	);
}
