// ============================================================================
// Become a Seller Loading
// ============================================================================
//
// Skeleton shown while the become-a-seller page suspends (auth check).

import { Skeleton } from "@/components/primitives/skeleton";

export default function BecomeASellerLoading() {
	return (
		<div
			container-id="become-seller-loading"
			className="w-full max-w-lg space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm"
		>
			<Skeleton className="h-6 w-40" />
			<Skeleton className="h-4 w-64" />
			<Skeleton className="h-1.5 w-full rounded-full" />
			<div className="flex flex-col gap-3 pt-2">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-20 w-full" />
			</div>
			<Skeleton className="h-10 w-full" />
		</div>
	);
}
