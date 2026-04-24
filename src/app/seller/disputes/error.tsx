"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function SellerDisputesError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Failed to load disputes"
			description="There was a problem loading your disputes. Please try again."
			error={error}
			reset={reset}
		/>
	);
}
