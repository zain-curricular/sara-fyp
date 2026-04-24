"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function ConfirmReceiptError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Failed to load confirmation"
			error={error}
			reset={reset}
		/>
	);
}
