import { Skeleton } from "@/components/primitives/skeleton";

export default function OnboardingProfileLoading() {
	return (
		<div className="w-full max-w-xl space-y-8 rounded-xl border border-border bg-card p-6 shadow-sm">
			<div className="space-y-2">
				<Skeleton className="h-7 w-56" />
				<Skeleton className="h-4 w-full max-w-md" />
			</div>
			<div className="flex gap-4">
				<Skeleton className="size-24 rounded-full" />
				<Skeleton className="h-10 w-32" />
			</div>
			<div className="space-y-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
			<Skeleton className="h-10 w-40" />
		</div>
	);
}
