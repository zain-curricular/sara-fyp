import { Skeleton } from "@/components/primitives/skeleton";

export default function MechanicDashboardLoading() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-9 w-56" />
			</div>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-24 rounded-xl" />
				))}
			</div>
			<Skeleton className="h-64 rounded-xl" />
		</div>
	);
}
