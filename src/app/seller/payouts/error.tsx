"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function SellerPayoutsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Failed to load payouts"
			description="There was a problem loading your payout history. Please try again."
			error={error}
			reset={reset}
		/>
	);
}
