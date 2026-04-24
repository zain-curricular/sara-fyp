import { Skeleton } from "@/components/primitives/skeleton";

export default function MechanicCompletedLoading() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-8 w-56" />
			<Skeleton className="h-64 rounded-xl" />
		</div>
	);
}
