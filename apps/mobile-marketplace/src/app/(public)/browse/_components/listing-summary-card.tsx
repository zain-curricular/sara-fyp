import type { ListingSummary } from "@/lib/features/product-catalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

type ListingSummaryCardProps = {
	listing: ListingSummary;
};

export function ListingSummaryCard({ listing }: ListingSummaryCardProps) {
	return (
		<Card size="sm" className="h-full transition-colors hover:bg-accent/40">
			<CardHeader>
				<CardTitle className="line-clamp-2 text-base">{listing.title}</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-1.5">
				<p className="text-base font-semibold tabular-nums">
					${listing.price.toLocaleString()}
				</p>
				<p className="text-sm text-muted-foreground">
					{listing.city} · {listing.condition}
				</p>
			</CardContent>
		</Card>
	);
}
