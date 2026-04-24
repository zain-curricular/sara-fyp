// ============================================================================
// Forgot Password Error Boundary
// ============================================================================
//
// Catches render errors on the /forgot-password route.

"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function ForgotPasswordError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			description="Something went wrong loading this page. Check your connection and try again."
			error={error}
			reset={reset}
			title="Could not load password reset"
		/>
	);
}
