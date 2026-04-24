// ============================================================================
// Buyer Addresses Loading
// ============================================================================
//
// Skeleton state for the addresses list page. Mirrors the card grid layout
// of the real shell with approximate address card dimensions.

import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

function AddressCardSkeleton() {
	return (
		<Card size="sm">
			<CardHeader>
				<Skeleton className="h-4 w-28" />
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				<Skeleton className="h-3.5 w-36" />
				<Skeleton className="h-3 w-28" />
				<Skeleton className="h-3 w-48" />
				<Skeleton className="h-3 w-32" />
			</CardContent>
			<CardFooter className="gap-2">
				<Skeleton className="h-8 w-14" />
				<Skeleton className="h-8 w-24" />
				<Skeleton className="h-8 w-16" />
			</CardFooter>
		</Card>
	);
}

export default function AddressesLoading() {
	return (
		<div
			container-id="addresses-shell"
			className="flex flex-col flex-1 min-h-0 p-4 relative overflow-auto gap-6"
		>
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-1.5">
					<Skeleton className="h-7 w-44" />
					<Skeleton className="h-4 w-56" />
				</div>
				<Skeleton className="h-9 w-32" />
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<AddressCardSkeleton />
				<AddressCardSkeleton />
				<AddressCardSkeleton />
			</div>
		</div>
	);
}
