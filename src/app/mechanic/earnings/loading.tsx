import { Skeleton } from "@/components/primitives/skeleton";

export default function MechanicEarningsLoading() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-8 w-40" />
			<div className="grid grid-cols-2 gap-3">
				<Skeleton className="h-24 rounded-xl" />
				<Skeleton className="h-24 rounded-xl" />
			</div>
			<Skeleton className="h-64 rounded-xl" />
		</div>
	);
}
