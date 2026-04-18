"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function ContinueError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			description="We could not finish signing you in. Check your connection and try again."
			error={error}
			reset={reset}
			title="Something went wrong"
		/>
	);
}
