import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

function DisputeRowSkeleton() {
	return (
		<Card size="sm">
			<CardHeader>
				<Skeleton className="h-4 w-40" />
			</CardHeader>
			<CardContent className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<Skeleton className="h-3 w-24" />
					<Skeleton className="h-3 w-28" />
				</div>
				<Skeleton className="h-8 w-14" />
			</CardContent>
		</Card>
	);
}

export default function DisputesLoading() {
	return (
		<div
			container-id="disputes-list-shell"
			className="flex flex-col flex-1 min-h-0 p-4 relative overflow-auto gap-6"
		>
			<div className="flex flex-col gap-1.5">
				<Skeleton className="h-7 w-36" />
				<Skeleton className="h-4 w-52" />
			</div>
			<div className="flex gap-2 border-b border-border pb-2">
				<Skeleton className="h-4 w-8" />
				<Skeleton className="h-4 w-10" />
				<Skeleton className="h-4 w-16" />
			</div>
			<div className="flex flex-col gap-3">
				<DisputeRowSkeleton />
				<DisputeRowSkeleton />
				<DisputeRowSkeleton />
			</div>
		</div>
	);
}
