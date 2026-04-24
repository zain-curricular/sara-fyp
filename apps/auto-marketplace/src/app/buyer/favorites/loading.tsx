import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

function CardSkeleton() {
	return (
		<Card size="sm">
			<CardHeader>
				<Skeleton className="h-5 w-full max-w-xs" />
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				<Skeleton className="h-6 w-24" />
				<Skeleton className="h-4 w-32" />
			</CardContent>
		</Card>
	);
}

export default function BuyerFavoritesLoading() {
	return (
		<div className="flex flex-col gap-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-72" />
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<CardSkeleton key={i} />
				))}
			</div>
		</div>
	);
}
