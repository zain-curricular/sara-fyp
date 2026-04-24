import { Skeleton } from "@/components/primitives/skeleton";

export default function MechanicSettingsLoading() {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-8 w-32" />
			<Skeleton className="h-48 rounded-xl" />
			<Skeleton className="h-48 rounded-xl" />
			<Skeleton className="h-24 rounded-xl" />
		</div>
	);
}
