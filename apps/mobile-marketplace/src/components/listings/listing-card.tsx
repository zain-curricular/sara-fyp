import Link from "next/link";

import type { ListingRecord } from "@/lib/features/listings";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Badge } from "@/components/primitives/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { cn } from "@/lib/utils";

type ListingCardProps = {
	listing: ListingRecord;
	className?: string;
};

export function ListingCard({ listing, className }: ListingCardProps) {
	return (
		<Link href={`/listings/${listing.id}`} className={cn("block", className)}>
			<Card size="sm" className="cursor-pointer transition-colors hover:bg-accent/40">
				<CardHeader>
					<CardTitle className="line-clamp-2 text-base">{listing.title}</CardTitle>
					<CardAction
						className="z-10"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
					>
						<FavoriteButton listingId={listing.id} size="icon-sm" />
					</CardAction>
				</CardHeader>
				<CardContent className="flex flex-col gap-2">
					<p className="text-lg font-semibold tabular-nums">${listing.price.toLocaleString()}</p>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">{listing.condition}</Badge>
						<span className="text-sm text-muted-foreground">{listing.city}</span>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
