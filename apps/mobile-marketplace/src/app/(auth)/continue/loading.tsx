import { Skeleton } from "@/components/primitives/skeleton";

export default function ContinueLoading() {
	return (
		<div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 shadow-sm">
			<Skeleton className="h-4 w-48" />
			<Skeleton className="h-4 w-32" />
		</div>
	);
}
