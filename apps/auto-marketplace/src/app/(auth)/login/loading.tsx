import { Skeleton } from "@/components/primitives/skeleton";

export default function LoginLoading() {
	return (
		<div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
			<Skeleton className="mx-auto h-7 w-32" />
			<Skeleton className="h-10 w-full" />
		</div>
	);
}
