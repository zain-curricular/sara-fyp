"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function EditAddressError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Failed to load address"
			error={error}
			reset={reset}
		/>
	);
}
