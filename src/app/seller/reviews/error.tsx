"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function SellerReviewsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Failed to load reviews"
			description="There was a problem loading your reviews. Please try again."
			error={error}
			reset={reset}
		/>
	);
}
