"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function LoginError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			description="Something went wrong while loading sign-in. Check your connection and try again."
			error={error}
			reset={reset}
			title="Could not load sign-in"
		/>
	);
}
