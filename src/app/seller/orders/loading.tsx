// ============================================================================
// Seller Orders Loading Skeleton
// ============================================================================

import { Skeleton } from "@/components/primitives/skeleton";

export default function SellerOrdersLoading() {
	return (
		<div container-id="seller-orders-loading" className="flex flex-col gap-6">

			<div className="flex items-center justify-between">
				<Skeleton className="h-9 w-32" />
				<Skeleton className="h-5 w-16" />
			</div>

			<div className="flex gap-2">
				{[0, 1, 2, 3, 4].map((i) => (
					<Skeleton key={i} className="h-7 w-20 rounded-full" />
				))}
			</div>

			<div className="flex flex-col gap-3">
				{[0, 1, 2, 3].map((i) => (
					<div key={i} className="flex items-center gap-4 rounded-xl border border-border p-4">
						<Skeleton className="size-10 shrink-0 rounded-full" />
						<div className="flex flex-1 flex-col gap-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-48" />
						</div>
						<div className="flex flex-col items-end gap-2">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-7 w-16" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
