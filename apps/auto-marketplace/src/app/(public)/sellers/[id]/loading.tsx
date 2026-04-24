import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

function StatCardSkeleton() {
	return (
		<Card size="sm">
			<CardHeader className="pb-2">
				<Skeleton className="h-3 w-20" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-8 w-12" />
			</CardContent>
		</Card>
	);
}

export default function SellerPublicLoading() {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
				<Skeleton className="size-20 shrink-0 rounded-full" />
				<div className="min-w-0 space-y-2">
					<Skeleton className="h-8 w-48 max-w-full" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<StatCardSkeleton key={i} />
				))}
			</div>
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-24" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-12 w-full max-w-md" />
				</CardContent>
			</Card>
		</div>
	);
}
