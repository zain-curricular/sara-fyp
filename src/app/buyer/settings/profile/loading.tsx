import { Separator } from "@/components/primitives/separator";
import { Skeleton } from "@/components/primitives/skeleton";

export default function ProfileSettingsLoading() {
	return (
		<div className="flex max-w-xl flex-col gap-8">
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-full max-w-sm" />
			</div>
			<div className="flex flex-col gap-1">
				<Skeleton className="h-3 w-16" />
				<Separator />
			</div>
			<div className="space-y-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-24 w-full" />
			</div>
			<Skeleton className="h-10 w-32" />
		</div>
	);
}
