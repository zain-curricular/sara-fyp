import { Skeleton } from "@/components/primitives/skeleton";

export default function SellerPayoutsLoading() {
	return (
		<div container-id="payouts-loading" className="flex flex-col gap-6">
			<Skeleton className="h-10 w-36" />
			<Skeleton className="h-64 w-full rounded-xl" />
		</div>
	);
}
