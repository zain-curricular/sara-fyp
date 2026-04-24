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
			description="We could not redirect you. Check your connection and try again."
			error={error}
			reset={reset}
			title="Something went wrong"
		/>
	);
}
