// ============================================================================
// LiveRecommendationsRail
// ============================================================================
//
// Behaviour-driven recommendation grid. Re-ranks within ~150ms of every view,
// filter or favourite (via useLiveRecommendations) without a page reload.
// Each card carries the engine's reasons ("Samsung", "Under Rs 50k") so the
// decision is visible, and the grid fades in on every re-rank so the change is
// noticeable during a demo.
//
// States
// ------
//   first load      → server `fallbackListings` if given, else skeleton cards
//   cold profile    → trending picks, title switches to `coldTitle`
//   live            → personalised picks with reason badges
//   error           → keeps the last good result; renders nothing if none

"use client";

import { Sparkles } from "lucide-react";

import type { ListingRecord } from "@/lib/features/listings";
import { isColdProfile, useLiveRecommendations, type RecommendedListing } from "@/lib/features/recommendations";
import { ListingCard } from "@/components/listings/listing-card";
import { Badge } from "@/components/primitives/badge";
import { Card, CardContent } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

type LiveRecommendationsRailProps = {
	title: string;
	description: string;
	/** Heading used before any behaviour has been recorded. */
	coldTitle?: string;
	coldDescription?: string;
	/** Listing on screen (detail page) — excluded from results. */
	contextListingId?: string | null;
	limit?: number;
	/** Server-rendered listings shown until the first live decision lands. */
	fallbackListings?: ListingRecord[];
	/** Hide entirely while the profile is cold (e.g. detail page). */
	hideWhenCold?: boolean;
	containerId: string;
};

function RecommendationCardSkeleton() {
	return (
		<Card size="sm" className="h-full overflow-hidden">
			<Skeleton className="aspect-[4/3] w-full rounded-none" />
			<CardContent className="flex flex-col gap-2">
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-5 w-1/3" />
				<Skeleton className="h-3 w-1/2" />
			</CardContent>
		</Card>
	);
}

function RecommendationReasons({ listing }: { listing: RecommendedListing }) {
	return (
		<div container-id="recommendation-reasons" className="flex flex-wrap items-center gap-1.5">
			<Sparkles className="size-3 text-primary" aria-hidden />
			{listing.recommendation.reasons.map((reason) => (
				<Badge key={reason} variant="secondary" className="rounded-sm">
					{reason}
				</Badge>
			))}
		</div>
	);
}

/** Live, re-ranking recommendation grid. */
export function LiveRecommendationsRail({
	title,
	description,
	coldTitle,
	coldDescription,
	contextListingId = null,
	limit = 4,
	fallbackListings = [],
	hideWhenCold = false,
	containerId,
}: LiveRecommendationsRailProps) {
	const { data, isLoading, profile } = useLiveRecommendations({ contextListingId, limit });
	const cold = isColdProfile(profile);

	if (hideWhenCold && cold) return null;

	const liveListings = data?.listings ?? null;
	const showSkeleton = liveListings === null && fallbackListings.length === 0 && isLoading;
	if (liveListings !== null && liveListings.length === 0) return null;
	if (liveListings === null && fallbackListings.length === 0 && !isLoading) return null;

	// Re-key the grid on the ranked ids so every re-rank replays the fade-in
	const gridKey = liveListings?.map((listing) => listing.id).join(",") ?? "fallback";

	return (
		<section container-id={containerId} className="flex flex-col gap-4">
			<div className="flex flex-col gap-0.5">
				<h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
					{cold && coldTitle ? coldTitle : title}
					{!cold ? (
						<Badge variant="outline" className="rounded-sm">
							<span className="size-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden />
							Live
						</Badge>
					) : null}
				</h2>
				<p className="text-xs text-muted-foreground">{cold && coldDescription ? coldDescription : description}</p>
			</div>

			{showSkeleton ? (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{Array.from({ length: limit }, (_, index) => (
						<RecommendationCardSkeleton key={index} />
					))}
				</div>
			) : (
				<div
					key={gridKey}
					container-id={`${containerId}-grid`}
					className="grid grid-cols-2 gap-4 duration-500 animate-in fade-in slide-in-from-bottom-2 lg:grid-cols-4"
				>
					{liveListings
						? liveListings.map((listing) => (
								<div key={listing.id} container-id="recommendation-item" className="flex flex-col gap-2">
									<ListingCard listing={listing} />
									<RecommendationReasons listing={listing} />
								</div>
							))
						: fallbackListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
				</div>
			)}
		</section>
	);
}
