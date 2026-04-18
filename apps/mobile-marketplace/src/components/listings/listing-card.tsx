import Link from "next/link";

import type { ListingRecord } from "@/lib/features/listings";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

type ListingCardProps = {
	listing: ListingRecord;
	className?: string;
};

export function ListingCard({ listing, className }: ListingCardProps) {
	return (
		<Link href={`/listings/${listing.id}`} className="block">
			<Card
				size="sm"
				className={cn("cursor-pointer transition-colors hover:bg-accent/40", className)}
			>
				<CardHeader>
					<CardTitle className="line-clamp-2 text-base">{listing.title}</CardTitle>
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
