import { Skeleton } from "@/components/primitives/skeleton";

export default function SellerStoreLoading() {
	return (
		<div container-id="store-loading" className="flex flex-col gap-6">
			<Skeleton className="h-10 w-48" />
			<Skeleton className="h-6 w-32" />
			<div className="flex flex-col gap-4">
				<Skeleton className="h-64 w-full rounded-xl" />
				<Skeleton className="h-10 w-28 self-end" />
			</div>
		</div>
	);
}
