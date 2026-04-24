import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

function BrandCardSkeleton() {
	return (
		<Card size="sm">
			<CardHeader>
				<Skeleton className="h-5 w-32" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-4 w-44" />
			</CardContent>
		</Card>
	);
}

export default function BrowseBrandsLoading() {
	return (
		<div className="flex flex-col gap-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-52" />
				<Skeleton className="h-4 w-80 max-w-full" />
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 9 }).map((_, i) => (
					<BrandCardSkeleton key={i} />
				))}
			</div>
		</div>
	);
}
