"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function SellerAnalyticsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Failed to load analytics"
			description="Analytics could not be loaded. Please try again."
			error={error}
			reset={reset}
		/>
	);
}
