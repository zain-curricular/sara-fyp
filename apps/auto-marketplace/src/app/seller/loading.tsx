import { Skeleton } from "@/components/primitives/skeleton";

export default function SellerLoading() {
	return (
		<div className="space-y-2">
			<Skeleton className="h-8 w-32" />
			<Skeleton className="h-4 w-full max-w-md" />
		</div>
	);
}
