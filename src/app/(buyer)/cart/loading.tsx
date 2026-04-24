// ============================================================================
// Cart Loading Skeleton
// ============================================================================
//
// Server-rendered skeleton shown during cart page RSC suspension.

import { Skeleton } from "@/components/primitives/skeleton";

export default function CartLoading() {
	return (
		<div container-id="cart-loading" className="flex flex-col gap-6">

			<div className="flex items-center gap-3">
				<Skeleton className="size-6 rounded" />
				<Skeleton className="h-8 w-32" />
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
				<div className="flex flex-col gap-4">
					{[0, 1].map((i) => (
						<div key={i} className="flex flex-col gap-0 rounded-xl border border-border p-4">
							<Skeleton className="mb-4 h-5 w-40" />
							{[0, 1, 2].map((j) => (
								<div key={j} className="flex gap-4 py-4">
									<Skeleton className="size-16 shrink-0 rounded-md" />
									<div className="flex flex-1 flex-col gap-2">
										<Skeleton className="h-4 w-3/4" />
										<Skeleton className="h-3 w-1/3" />
										<Skeleton className="h-6 w-24" />
									</div>
									<Skeleton className="h-5 w-16 shrink-0" />
								</div>
							))}
							<Skeleton className="mt-2 h-9 w-full" />
						</div>
					))}
				</div>

				<div className="flex flex-col gap-3 rounded-xl border border-border p-4">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-2/3" />
					<Skeleton className="h-px w-full" />
					<Skeleton className="h-9 w-full" />
				</div>
			</div>
		</div>
	);
}
