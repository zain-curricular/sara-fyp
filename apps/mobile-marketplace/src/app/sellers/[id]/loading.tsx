import { Skeleton } from "@/components/primitives/skeleton";

export default function SellerPublicLoading() {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
				<Skeleton className="size-20 rounded-full" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<Skeleton key={i} className="h-24 w-full rounded-xl" />
				))}
			</div>
			<Skeleton className="h-32 w-full rounded-xl" />
		</div>
	);
}
