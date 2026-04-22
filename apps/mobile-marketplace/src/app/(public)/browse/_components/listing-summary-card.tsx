// ============================================================================
// ListingSummaryCard
// ============================================================================
//
// Compact listing card for the model browse page. Shows image placeholder,
// condition badge, title, price prominently, and a city footer. Entire card
// is a link to the listing detail page.

import Link from "next/link";
import { ImageIcon, MapPin } from "lucide-react";

import type { ListingSummary } from "@/lib/features/product-catalog";
import { Badge } from "@/components/primitives/badge";
import { Card, CardContent } from "@/components/primitives/card";

const CONDITION_LABELS: Record<string, string> = {
	new: "New",
	like_new: "Like New",
	excellent: "Excellent",
	good: "Good",
	fair: "Fair",
	poor: "Poor",
};

type ListingSummaryCardProps = {
	listing: ListingSummary;
};

/** Compact listing card for catalog browse — image, price, condition, city. */
export function ListingSummaryCard({ listing }: ListingSummaryCardProps) {
	return (
		<Link href={`/listings/${listing.id}`} className="group block focus:outline-none">
			<Card
				size="sm"
				className="h-full cursor-pointer overflow-hidden transition-all group-hover:border-foreground/20 group-hover:shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-ring"
			>
				{/* Image placeholder */}
				<div className="flex aspect-[4/3] w-full items-center justify-center bg-muted/30 transition-colors group-hover:bg-muted/40">
					<ImageIcon className="size-8 text-muted-foreground/20" aria-hidden />
				</div>

				<CardContent className="flex flex-col gap-2 p-3">
					{/* Condition badge */}
					<Badge variant="secondary" className="w-fit rounded-sm text-[10px]">
						{CONDITION_LABELS[listing.condition] ?? listing.condition}
					</Badge>

					{/* Title */}
					<p className="line-clamp-2 text-sm font-medium leading-snug">{listing.title}</p>

					{/* Price */}
					<p className="text-base font-bold tabular-nums text-primary">
						${listing.price.toLocaleString()}
					</p>

					{/* City */}
					<div className="flex items-center gap-1 text-[11px] text-muted-foreground">
						<MapPin className="size-3 shrink-0" aria-hidden />
						{listing.city}
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
