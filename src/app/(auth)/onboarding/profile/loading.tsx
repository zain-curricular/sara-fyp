import { Skeleton } from "@/components/primitives/skeleton";

export default function OnboardingProfileLoading() {
	return (
		<div className="w-full max-w-xl space-y-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
			<div className="space-y-1">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-4 w-64" />
			</div>
			<div className="flex items-center gap-5">
				<Skeleton className="size-20 shrink-0 rounded-full" />
				<div className="flex flex-col gap-2">
					<Skeleton className="h-8 w-28" />
					<Skeleton className="h-3 w-36" />
				</div>
			</div>
			<Skeleton className="h-px w-full" />
			<div className="space-y-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<div className="grid grid-cols-2 gap-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
				<Skeleton className="h-10 w-full" />
			</div>
			<Skeleton className="h-10 w-36" />
		</div>
	);
}
