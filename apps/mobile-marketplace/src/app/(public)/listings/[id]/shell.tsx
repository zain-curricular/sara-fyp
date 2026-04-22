// ============================================================================
// Listing Detail Shell
// ============================================================================
//
// Client shell for the listing detail page. Two-column layout on desktop:
// left = gallery + condition report + description + specs + seller reviews;
// right = sticky trust panel (price/CTA) + seller card + escrow badge.
//
// Seller profile is fetched client-side via usePublicProfile so the RSC stays
// fully cacheable. RecordListingView fires a view-count event in the background.
//
// Buy / bid buttons are intentionally disabled — escrow and auction flows are
// not yet wired; they navigate to a future checkout route.

"use client";

import Link from "next/link";
import { CheckCircle2, MapPin, ShieldCheck, Star } from "lucide-react";

import type { ListingImageRecord, ListingRecord } from "@/lib/features/listings";
import type { ReviewsListPayload } from "@/lib/features/reviews/types";
import { usePublicProfile } from "@/lib/features/profiles/hooks";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { RecordListingView } from "@/components/favorites/record-listing-view";
import { ListingDetailGallery } from "@/components/listings/listing-detail-gallery";
import { ListingSpecsTable } from "@/components/listings/listing-specs-table";
import { ReviewsList } from "@/components/reviews/reviews-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/primitives/avatar";
import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { Skeleton } from "@/components/primitives/skeleton";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type ListingDetailShellProps = {
	listing: ListingRecord;
	images: ListingImageRecord[];
	sellerReviews: ReviewsListPayload;
};

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const CONDITION_LABELS: Record<string, string> = {
	new: "New",
	like_new: "Like New",
	excellent: "Excellent",
	good: "Good",
	fair: "Fair",
	poor: "Poor",
};

const CONDITION_CHECKS: Record<string, string[]> = {
	new: ["Sealed in original box", "Full accessories included", "Warranty card present", "No usage marks"],
	like_new: ["Opened but unused", "Full accessories included", "No visible marks or scratches"],
	excellent: ["Very light use only", "Minor marks under close inspection", "All buttons and ports working"],
	good: ["Normal everyday wear", "Minor cosmetic marks", "All core functions verified"],
	fair: ["Visible wear signs", "Some cosmetic damage noted", "All primary functions working"],
	poor: ["Heavy wear and use", "Cosmetic damage present", "Verify all functions before purchase"],
};

const FALLBACK_CHECKS = ["Device tested by seller", "Photos represent actual item", "All listed specs confirmed"];

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

/** Full-page shell for /listings/[id] — gallery + trust panel + seller card. */
export default function ListingDetailShell({ listing, images, sellerReviews }: ListingDetailShellProps) {
	const { data: seller, isLoading: sellerLoading } = usePublicProfile(listing.user_id);

	const showBuyNow = listing.sale_type === "fixed" || listing.sale_type === "both";
	const showAuction = listing.sale_type === "auction" || listing.sale_type === "both";
	const conditionChecks = CONDITION_CHECKS[listing.condition] ?? FALLBACK_CHECKS;

	return (
		<>
			<RecordListingView listingId={listing.id} />

			<div
				container-id="listing-detail-grid"
				className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10"
			>

				{/* Left column */}
				<div container-id="listing-detail-main" className="flex min-w-0 flex-col gap-6">

					<ListingDetailGallery images={images} title={listing.title} />

					{/* Condition report */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Condition report</CardTitle>
							<CardAction>
								<Badge variant="secondary" className="rounded-sm text-[10px]">TESTED</Badge>
							</CardAction>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-x-4 gap-y-2">
								{conditionChecks.map((check) => (
									<div key={check} className="flex items-start gap-2 text-sm">
										<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
										{check}
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Description */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Description</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
								{listing.description ?? "No description provided."}
							</p>
						</CardContent>
					</Card>

					<ListingSpecsTable listing={listing} />

					{/* Seller reviews */}
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

				{/* Right column — sticky trust panel */}
				<aside
					container-id="listing-detail-side"
					className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start"
				>

					{/* Trust panel: title, price, CTAs */}
					<Card size="sm">
						<CardContent className="flex flex-col gap-4 pt-4">

							{/* Badges */}
							<div className="flex flex-wrap gap-1.5">
								<Badge variant="secondary" className="rounded-sm text-[10px]">
									{CONDITION_LABELS[listing.condition] ?? listing.condition}
								</Badge>
								{listing.sale_type !== "fixed" && (
									<Badge className="rounded-sm text-[10px]">LIVE</Badge>
								)}
							</div>

							{/* Title */}
							<h1 className="text-xl font-bold leading-snug tracking-tight">{listing.title}</h1>

							{/* City */}
							<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
								<MapPin className="size-3.5 shrink-0" aria-hidden />
								{listing.city}{listing.area ? `, ${listing.area}` : ""}
							</div>

							<Separator />

							{/* Buy now section */}
							{showBuyNow && (
								<div className="flex flex-col gap-2">
									<p className="text-2xl font-bold tabular-nums text-primary">
										${listing.price.toLocaleString()}
									</p>
									{listing.is_negotiable && (
										<p className="text-xs text-muted-foreground">Price is negotiable</p>
									)}
									<Button type="button" className="w-full" disabled>
										Buy now (escrow)
									</Button>
								</div>
							)}

							{/* Or divider between buy-now and auction */}
							{showBuyNow && showAuction && (
								<div className="flex items-center gap-2">
									<Separator className="flex-1" />
									<span className="text-xs text-muted-foreground">or</span>
									<Separator className="flex-1" />
								</div>
							)}

							{/* Auction section */}
							{showAuction && (
								<div className="flex flex-col gap-2">
									{!showBuyNow && (
										<p className="text-2xl font-bold tabular-nums text-primary">
											${listing.price.toLocaleString()}{" "}
											<span className="text-sm font-normal text-muted-foreground">current bid</span>
										</p>
									)}
									<Button type="button" variant="outline" className="w-full" disabled>
										Place bid
									</Button>
								</div>
							)}

							<Separator />

							{/* Favorite */}
							<div className="flex items-center gap-2">
								<FavoriteButton listingId={listing.id} size="icon" />
								<span className="text-sm text-muted-foreground">Save to favorites</span>
							</div>
						</CardContent>
					</Card>

					{/* Seller card */}
					<Card size="sm">
						<CardContent className="flex items-center gap-3 pt-4">
							<Avatar size="lg">
								{seller?.avatar_url ? (
									<AvatarImage src={seller.avatar_url} alt={seller.display_name ?? "Seller"} />
								) : null}
								<AvatarFallback>
									{(seller?.display_name ?? "S")[0]?.toUpperCase()}
								</AvatarFallback>
							</Avatar>

							<div className="flex min-w-0 flex-1 flex-col gap-0.5">
								{sellerLoading ? (
									<>
										<Skeleton className="h-4 w-28" />
										<Skeleton className="mt-1 h-3 w-20" />
									</>
								) : (
									<>
										<p className="truncate text-sm font-semibold">
											{seller?.display_name ?? "Seller"}
										</p>
										<div className="flex items-center gap-1 text-xs text-muted-foreground">
											<Star className="size-3 fill-primary text-primary" aria-hidden />
											<span>{seller?.avg_rating?.toFixed(1) ?? "—"}</span>
											<span>·</span>
											<span>{seller?.total_sales ?? 0} sold</span>
										</div>
									</>
								)}
							</div>

							<Link
								href={`/sellers/${listing.user_id}`}
								className={buttonVariants({ variant: "outline", size: "sm" })}
							>
								View
							</Link>
						</CardContent>
					</Card>

					{/* Escrow badge */}
					<Card size="sm" className="border-primary/20 bg-primary/5">
						<CardContent className="flex gap-3 pt-4">
							<ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
							<div className="flex flex-col gap-1">
								<p className="text-sm font-semibold">Escrow protected</p>
								<p className="text-xs leading-relaxed text-muted-foreground">
									Your payment is held safely until you confirm receipt. Both buyer and seller are protected.
								</p>
							</div>
						</CardContent>
					</Card>
				</aside>
			</div>
		</>
	);
}
