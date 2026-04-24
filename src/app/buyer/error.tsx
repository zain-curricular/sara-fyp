"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function BuyerError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			description="We could not load the buyer area. Check your connection and try again."
			error={error}
			reset={reset}
			title="Could not load buyer area"
		/>
	);
}
