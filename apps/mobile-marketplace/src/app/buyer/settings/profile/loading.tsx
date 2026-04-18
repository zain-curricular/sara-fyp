import { Skeleton } from "@/components/primitives/skeleton";

export default function ProfileSettingsLoading() {
	return (
		<div className="flex max-w-xl flex-col gap-6">
			<Skeleton className="h-8 w-48" />
			<div className="space-y-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-24 w-full" />
			</div>
		</div>
	);
}
