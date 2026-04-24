// ============================================================================
// Reset Password Error Boundary
// ============================================================================
//
// Catches render errors on the /reset-password route.

"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function ResetPasswordError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			description="Something went wrong loading the password reset page."
			error={error}
			reset={reset}
			title="Could not load password reset"
		/>
	);
}
