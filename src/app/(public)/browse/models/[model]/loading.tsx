import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

function ListingCardSkeleton() {
	return (
		<Card size="sm">
			<CardHeader>
				<Skeleton className="h-5 w-full max-w-md" />
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-40" />
			</CardContent>
		</Card>
	);
}

export default function ModelListingsLoading() {
	return (
		<div className="flex flex-col gap-6">
			<div className="space-y-2">
				<Skeleton className="h-4 w-48" />
				<Skeleton className="h-8 w-72 max-w-full" />
				<Skeleton className="h-4 w-40" />
			</div>

			<div className="flex flex-wrap gap-2">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-6 w-24 rounded-sm" />
				))}
			</div>

			<div className="grid grid-cols-1 gap-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<ListingCardSkeleton key={i} />
				))}
			</div>
		</div>
	);
}
