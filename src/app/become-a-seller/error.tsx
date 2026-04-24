// ============================================================================
// Become a Seller Error Boundary
// ============================================================================
//
// Catches render errors on the /become-a-seller route.

"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function BecomeASellerError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			description="Something went wrong loading the seller onboarding page."
			error={error}
			reset={reset}
			title="Could not load seller setup"
		/>
	);
}
