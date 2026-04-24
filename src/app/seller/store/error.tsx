"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function SellerStoreError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Failed to load store"
			description="There was a problem loading your store settings. Please try again."
			error={error}
			reset={reset}
		/>
	);
}
