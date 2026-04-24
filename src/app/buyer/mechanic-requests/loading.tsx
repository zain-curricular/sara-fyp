import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

function RequestRowSkeleton() {
	return (
		<Card size="sm">
			<CardHeader>
				<Skeleton className="h-4 w-48" />
			</CardHeader>
			<CardContent className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<Skeleton className="h-3 w-36" />
					<Skeleton className="h-3 w-24" />
				</div>
				<Skeleton className="h-8 w-14" />
			</CardContent>
		</Card>
	);
}

export default function MechanicRequestsLoading() {
	return (
		<div
			container-id="mechanic-requests-shell"
			className="flex flex-col flex-1 min-h-0 p-4 relative overflow-auto gap-6"
		>
			<div className="flex flex-col gap-1.5">
				<Skeleton className="h-7 w-52" />
				<Skeleton className="h-4 w-64" />
			</div>
			<div className="flex flex-col gap-3">
				<RequestRowSkeleton />
				<RequestRowSkeleton />
				<RequestRowSkeleton />
			</div>
		</div>
	);
}
