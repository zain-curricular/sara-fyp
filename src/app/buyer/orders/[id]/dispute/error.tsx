"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function OpenDisputeError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Failed to load dispute form"
			error={error}
			reset={reset}
		/>
	);
}
