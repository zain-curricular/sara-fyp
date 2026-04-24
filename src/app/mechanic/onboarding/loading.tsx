import { Skeleton } from "@/components/primitives/skeleton";

export default function MechanicOnboardingLoading() {
	return (
		<div className="mx-auto max-w-2xl flex flex-col gap-6">
			<Skeleton className="h-9 w-64" />
			<Skeleton className="h-48 rounded-xl" />
			<Skeleton className="h-48 rounded-xl" />
			<Skeleton className="h-28 rounded-xl" />
		</div>
	);
}
