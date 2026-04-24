import { Skeleton } from "@/components/primitives/skeleton";

export default function SellerReviewsLoading() {
	return (
		<div container-id="reviews-loading" className="flex flex-col gap-6">
			<Skeleton className="h-10 w-32" />
			<Skeleton className="h-36 w-full rounded-xl" />
			<div className="flex flex-col gap-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-32 w-full rounded-xl" />
				))}
			</div>
		</div>
	);
}
