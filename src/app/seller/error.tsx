"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function SellerError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			description="We could not load the seller area. Check your connection and try again."
			error={error}
			reset={reset}
			title="Could not load seller area"
		/>
	);
}
