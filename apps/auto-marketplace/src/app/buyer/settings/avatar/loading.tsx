import { Skeleton } from "@/components/primitives/skeleton";

export default function AvatarSettingsLoading() {
	return (
		<div className="flex max-w-xl flex-col gap-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-4 w-full max-w-xs" />
			</div>
			<div className="flex flex-col gap-6 sm:flex-row sm:items-start">
				<Skeleton className="size-32 shrink-0 rounded-full" />
				<div className="flex flex-col gap-3">
					<Skeleton className="h-10 w-36" />
					<Skeleton className="h-3 w-full max-w-sm" />
				</div>
			</div>
		</div>
	);
}
