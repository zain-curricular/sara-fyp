// ============================================================================
// Similar Listings
// ============================================================================
//
// Client component that fetches and displays up to 6 similar listings for
// the current listing detail page. Uses /api/recommendations/similar.
// Renders as a 3-column grid of listing summary cards.

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Package } from "lucide-react";

import { Badge } from "@/components/primitives/badge";
import { Card, CardContent } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type SimilarListing = {
	id: string;
	title: string;
	price: number;
	city: string;
	condition: string;
	listing_images?: { url: string; position: number }[];
};

// ----------------------------------------------------------------------------
// Listing card
// ----------------------------------------------------------------------------

function SimilarListingCard({ listing }: { listing: SimilarListing }) {
	const images = [...(listing.listing_images ?? [])].sort(
		(a, b) => a.position - b.position,
	);
	const coverUrl = images[0]?.url ?? null;

	return (
		<Link href={`/listings/${listing.id}`}>
			<Card size="sm" className="h-full overflow-hidden transition-shadow hover:shadow-md">
				{/* Image */}
				<div className="relative aspect-video overflow-hidden bg-muted">
					{coverUrl ? (
						<Image
							src={coverUrl}
							alt={listing.title}
							fill
							className="object-cover transition-transform hover:scale-105"
							sizes="(max-width: 640px) 50vw, 33vw"
						/>
					) : (
						<div className="flex h-full items-center justify-center">
							<Package className="size-6 text-muted-foreground" aria-hidden />
						</div>
					)}
				</div>

				<CardContent className="flex flex-col gap-1.5 pt-3">
					<p className="line-clamp-2 text-sm font-medium leading-snug">{listing.title}</p>
					<p className="text-base font-bold tabular-nums text-primary">
						Rs {listing.price.toLocaleString()}
					</p>
					<div className="flex items-center justify-between gap-1">
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							<MapPin className="size-3" aria-hidden />
							{listing.city}
						</div>
						<Badge variant="secondary" className="rounded-sm text-[10px]">
							{listing.condition}
						</Badge>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function SimilarListings({ listingId }: { listingId: string }) {
	const [listings, setListings] = useState<SimilarListing[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(`/api/recommendations/similar?listingId=${encodeURIComponent(listingId)}`)
			.then((r) => r.json())
			.then((json) => {
				if (json.ok) setListings(json.data as SimilarListing[]);
			})
			.catch(() => null)
			.finally(() => setLoading(false));
	}, [listingId]);

	if (!loading && listings.length === 0) return null;

	return (
		<section container-id="similar-listings" className="flex flex-col gap-4">
			<h2 className="text-xl font-bold tracking-tight">Similar parts</h2>

			{loading ? (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="aspect-[4/3] rounded-xl" />
					))}
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
					{listings.map((listing) => (
						<SimilarListingCard key={listing.id} listing={listing} />
					))}
				</div>
			)}
		</section>
	);
}
