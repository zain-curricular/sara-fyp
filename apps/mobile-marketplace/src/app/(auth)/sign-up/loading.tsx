import { Skeleton } from "@/components/primitives/skeleton";

export default function SignUpLoading() {
	return (
		<div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
			<div className="space-y-2 text-center">
				<Skeleton className="mx-auto h-7 w-40" />
				<Skeleton className="mx-auto h-4 w-full max-w-xs" />
			</div>
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
		</div>
	);
}
