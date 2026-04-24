// ============================================================================
// Reset Password Loading
// ============================================================================
//
// Skeleton shown while the reset-password page suspends.

import { Skeleton } from "@/components/primitives/skeleton";

export default function ResetPasswordLoading() {
	return (
		<div
			container-id="reset-password-loading"
			className="w-full max-w-md space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm"
		>
			<Skeleton className="mx-auto h-7 w-48" />
			<Skeleton className="mx-auto h-4 w-64" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
		</div>
	);
}
