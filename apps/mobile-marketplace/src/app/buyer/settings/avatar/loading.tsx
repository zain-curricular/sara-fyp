import { Skeleton } from "@/components/primitives/skeleton";

export default function AvatarSettingsLoading() {
	return (
		<div className="flex max-w-xl flex-col gap-6">
			<Skeleton className="h-8 w-40" />
			<Skeleton className="size-32 rounded-full" />
		</div>
	);
}
