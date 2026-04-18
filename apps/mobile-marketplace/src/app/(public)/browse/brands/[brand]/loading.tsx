import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

function ModelCardSkeleton() {
	return (
		<Card size="sm">
			<CardHeader>
				<Skeleton className="h-5 w-40" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-4 w-16" />
			</CardContent>
		</Card>
	);
}

export default function BrandModelsLoading() {
	return (
		<div className="flex flex-col gap-6">
			<div className="space-y-2">
				<Skeleton className="h-4 w-48" />
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-4 w-80 max-w-full" />
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 9 }).map((_, i) => (
					<ModelCardSkeleton key={i} />
				))}
			</div>
		</div>
	);
}
