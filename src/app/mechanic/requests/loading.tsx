import { Skeleton } from "@/components/primitives/skeleton";

export default function MechanicRequestsLoading() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-8 w-48" />
			{Array.from({ length: 5 }).map((_, i) => (
				<Skeleton key={i} className="h-28 rounded-xl" />
			))}
		</div>
	);
}
