import { Skeleton } from "@/components/primitives/skeleton";

export default function SellerDisputesLoading() {
	return (
		<div container-id="disputes-loading" className="flex flex-col gap-6">
			<Skeleton className="h-10 w-36" />
			<div className="flex flex-col gap-2">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-20 w-full rounded-xl" />
				))}
			</div>
		</div>
	);
}
