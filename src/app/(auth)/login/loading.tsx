// ============================================================================
// Login Loading
// ============================================================================
//
// Skeleton placeholder while the login page suspends.

import { Skeleton } from "@/components/primitives/skeleton";

export default function LoginLoading() {
	return (
		<div
			container-id="login-loading"
			className="w-full max-w-md space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm"
		>
			<div className="flex justify-center">
				<Skeleton className="h-5 w-28" />
			</div>
			<Skeleton className="mx-auto h-7 w-48" />
			<Skeleton className="h-9 w-full rounded-lg" />
			<div className="flex flex-col gap-3">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
		</div>
	);
}
