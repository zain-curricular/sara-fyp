// ============================================================================
// ListingCard
// ============================================================================
//
// Compact card for displaying a listing in grid/list views. Renders an image
// placeholder, condition + sale-type badges, title, price, and a city/favorite
// footer row. The FavoriteButton click is isolated from the Link navigation via
// stopPropagation on the CardAction wrapper.
//


import Link from "next/link";

import type { ListingRecord } from "@/lib/features/listings";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Badge } from "@/components/primitives/badge";
import { Card, CardAction, CardContent } from "@/components/primitives/card";
import { cn } from "@/lib/utils";

// Human-readable labels for the condition enum values stored in the DB.
const CONDITION_LABELS: Record<string, string> = {
	new: "New",
	like_new: "Like New",
	excellent: "Excellent",
	good: "Good",
	fair: "Fair",
	poor: "Poor",
};

type ListingCardProps = {
	listing: ListingRecord;
	className?: string;
};

export function ListingCard({ listing, className }: ListingCardProps) {
	return (
		<Link
			href={`/listings/${listing.id}`}
			className={cn("group block focus:outline-none", className)}
		>
			<Card
				size="sm"
				className="h-full overflow-hidden cursor-pointer transition-all group-hover:border-foreground/20 group-hover:bg-accent/40 group-hover:shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-ring"
			>
				{/* Image placeholder — flush with card top edge (no padding) */}
				<div className="aspect-[4/3] w-full bg-muted/30" />

				<CardContent className="p-3 flex flex-col gap-2">
					{/* Badges row: condition always shown, LIVE shown for auction/both */}
					<div className="flex items-center gap-1.5">
						<Badge variant="secondary" className="rounded-sm text-[10px]">
							{CONDITION_LABELS[listing.condition] ?? listing.condition}
						</Badge>

						{listing.sale_type !== "fixed" && (
							<Badge className="rounded-sm text-[10px]">LIVE</Badge>
						)}
					</div>

					{/* Title */}
					<p className="text-sm font-semibold line-clamp-2">{listing.title}</p>

					{/* Price */}
					<p className="text-base font-bold text-primary tabular-nums">
						${listing.price.toLocaleString()}
					</p>

					{/* Footer: city left, favorite right */}
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">{listing.city}</span>

						<CardAction
							className="z-10"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<FavoriteButton listingId={listing.id} size="icon-sm" />
						</CardAction>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
