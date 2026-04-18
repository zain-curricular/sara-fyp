import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

export type ProfileStatsModel = {
	avg_rating: number;
	total_reviews: number;
	total_listings: number;
	total_sales: number;
};

export function ProfileStats({ stats }: { stats: ProfileStatsModel }) {
	const items = [
		{ label: "Avg. rating", value: stats.avg_rating.toFixed(1) },
		{ label: "Reviews", value: String(stats.total_reviews) },
		{ label: "Listings", value: String(stats.total_listings) },
		{ label: "Sales", value: String(stats.total_sales) },
	];

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{items.map((item) => (
				<Card key={item.label}>
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-medium text-muted-foreground">
							{item.label}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-semibold tabular-nums">{item.value}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
