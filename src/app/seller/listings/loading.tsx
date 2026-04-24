import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

function SellerListingRowSkeleton() {
	return (
		<div className="flex flex-col gap-2">
			<Card size="sm">
				<CardHeader>
					<Skeleton className="h-5 w-full max-w-xs" />
				</CardHeader>
				<CardContent className="flex flex-col gap-2">
					<Skeleton className="h-6 w-24" />
					<div className="flex flex-wrap items-center gap-2">
						<Skeleton className="h-5 w-16 rounded-full" />
						<Skeleton className="h-4 w-20" />
					</div>
				</CardContent>
			</Card>
			<Skeleton className="h-8 w-full max-w-[120px]" />
		</div>
	);
}

export default function SellerListingsLoading() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-72" />
				</div>
				<Skeleton className="h-9 w-28" />
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<SellerListingRowSkeleton key={i} />
				))}
			</div>
		</div>
	);
}
