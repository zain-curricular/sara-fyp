// ============================================================================
// Login Error Boundary
// ============================================================================
//
// Catches render errors on the /login route and shows a recovery prompt.

"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function LoginError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			description="Something went wrong loading the login page. Check your connection and try again."
			error={error}
			reset={reset}
			title="Could not load login"
		/>
	);
}
