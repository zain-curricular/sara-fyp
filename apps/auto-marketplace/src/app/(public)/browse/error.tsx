"use client";

import { RouteErrorState } from "@/components/layout/route-error-state";

export default function BrowseBrandsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex flex-col gap-6">
			<RouteErrorState
				title="Failed to load brands"
				description="Check your connection and try again."
				error={error}
				reset={reset}
			/>
		</div>
	);
}
