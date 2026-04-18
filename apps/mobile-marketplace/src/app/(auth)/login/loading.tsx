import { Skeleton } from "@/components/primitives/skeleton";

export default function LoginLoading() {
	return (
		<div className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6">
			<Skeleton className="mx-auto h-6 w-24" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-9 w-full" />
		</div>
	);
}
