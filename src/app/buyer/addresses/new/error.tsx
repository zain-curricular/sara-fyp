"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function NewAddressError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Something went wrong"
			error={error}
			reset={reset}
		/>
	);
}
