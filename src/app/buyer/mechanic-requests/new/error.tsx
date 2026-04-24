"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function NewMechanicRequestError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Failed to load request form"
			error={error}
			reset={reset}
		/>
	);
}
