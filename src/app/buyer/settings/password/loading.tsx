import { Skeleton } from "@/components/primitives/skeleton";

export default function PasswordSettingsLoading() {
	return (
		<div className="flex max-w-2xl flex-col gap-8">
			<div className="flex flex-col gap-1.5">
				<Skeleton className="h-7 w-44" />
				<Skeleton className="h-4 w-72" />
			</div>
			<div className="flex flex-col gap-6">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-36" />
			</div>
		</div>
	);
}
