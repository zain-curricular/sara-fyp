// ============================================================================
// Buyer Addresses Error
// ============================================================================

"use client";

import Link from "next/link";

import { RouteErrorState } from "@/components/layout/route-error-state";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function AddressesError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Failed to load addresses"
			description="Something went wrong. Check your connection and try again."
			error={error}
			reset={reset}
			actions={
				<Link className={cn(buttonVariants())} href="/buyer">
					Back to buyer home
				</Link>
			}
		/>
	);
}
