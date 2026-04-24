import { Skeleton } from "@/components/primitives/skeleton";

export default function SellerAnalyticsLoading() {
	return (
		<div container-id="analytics-loading-route" className="flex flex-col gap-6">
			<Skeleton className="h-10 w-40" />
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-24 rounded-xl" />
				))}
			</div>
			<Skeleton className="h-60 w-full rounded-xl" />
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Skeleton className="h-56 rounded-xl" />
				<Skeleton className="h-56 rounded-xl" />
			</div>
		</div>
	);
}
