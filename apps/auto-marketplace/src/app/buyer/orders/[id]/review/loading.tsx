import { Skeleton } from "@/components/primitives/skeleton";

export default function BuyerOrderReviewLoading() {
	return (
		<div className="flex max-w-lg flex-col gap-6">
			<div className="space-y-1">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-4 w-full max-w-md" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-4 w-16" />
				<Skeleton className="h-10 w-44" />
				<Skeleton className="h-3 w-full max-w-sm" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-4 w-40" />
				<Skeleton className="h-32 w-full" />
			</div>
			<Skeleton className="h-10 w-36" />
			<Skeleton className="h-9 w-28" />
		</div>
	);
}
