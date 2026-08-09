// ============================================================================
// Home Rails — real-data listing cards + "For You" recommendation rail
// ============================================================================
//
// Two exports the landing page composes:
//   * `HomeListingCard` — image-first listing card (real photos, next/image).
//     Used by the server-rendered "Recently listed" grid.
//   * `ForYouRail` — client rail that calls `/api/recommendations/for-you`
//     (personalised via pgvector once embeddings are backfilled). It is
//     auth-gated server-side, so it silently renders nothing for logged-out
//     visitors or when there is nothing to show.
//
// Both share one card so the visual language is identical across rails.

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Package, Sparkles } from "lucide-react";

import { Badge } from "@/components/primitives/badge";
import { Card, CardContent } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

// ----------------------------------------------------------------------------
// Shared types + labels
// ----------------------------------------------------------------------------

export type RailListing = {
	id: string;
	title: string;
	price: number;
	city: string;
	condition: string;
	listing_images?: { url: string; position: number }[] | null;
};

const CONDITION_LABELS: Record<string, string> = {
	new: "New",
	like_new: "Like New",
	excellent: "Excellent",
	good: "Good",
	fair: "Fair",
	poor: "Poor",
};

// ----------------------------------------------------------------------------
// Card
// ----------------------------------------------------------------------------

export function HomeListingCard({ listing }: { listing: RailListing }) {
	const images = [...(listing.listing_images ?? [])].sort((a, b) => a.position - b.position);
	const coverUrl = images[0]?.url ?? null;

	return (
		<Link href={`/listings/${listing.id}`} className="group block focus:outline-none">
			<Card size="sm" className="h-full overflow-hidden transition-all group-hover:shadow-md">
				{/* Cover image */}
				<div className="relative aspect-[4/3] overflow-hidden bg-muted">
					{coverUrl ? (
						<Image
							src={coverUrl}
							alt={listing.title}
							fill
							className="object-cover transition-transform duration-300 group-hover:scale-105"
							sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
						<span className="flex items-center gap-1 text-xs text-muted-foreground">
							<MapPin className="size-3" aria-hidden />
							{listing.city}
						</span>
						<Badge variant="secondary" className="rounded-sm text-[10px]">
							{CONDITION_LABELS[listing.condition] ?? listing.condition}
						</Badge>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

// ----------------------------------------------------------------------------
// For-You rail (client, self-hiding)
// ----------------------------------------------------------------------------

export function ForYouRail() {
	const [listings, setListings] = useState<RailListing[] | null>(null);

	useEffect(() => {
		let active = true;

		fetch("/api/recommendations/for-you")
			.then((r) => (r.ok ? r.json() : null))
			.then((json) => {
				if (active && json?.ok) setListings(json.data as RailListing[]);
				else if (active) setListings([]);
			})
			.catch(() => active && setListings([]));

		return () => {
			active = false;
		};
	}, []);

	// Logged-out / errored / empty → render nothing (no dead section on the page).
	if (listings !== null && listings.length === 0) return null;

	return (
		<section container-id="home-for-you" className="flex flex-col gap-5">
			<div className="flex items-center justify-between">
				<h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
					<Sparkles className="size-5 text-primary" aria-hidden />
					Recommended for you
				</h2>
				<Link
					href="/browse"
					className="text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					See all →
				</Link>
			</div>

			{listings === null ? (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="aspect-[4/3] rounded-xl" />
					))}
				</div>
			) : (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{listings.slice(0, 8).map((listing) => (
						<HomeListingCard key={listing.id} listing={listing} />
					))}
				</div>
			)}
		</section>
	);
}
