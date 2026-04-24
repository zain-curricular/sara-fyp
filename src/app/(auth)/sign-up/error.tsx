"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function SignUpError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			description="We could not load sign-up. Check your connection and try again."
			error={error}
			reset={reset}
			title="Something went wrong"
		/>
	);
}
