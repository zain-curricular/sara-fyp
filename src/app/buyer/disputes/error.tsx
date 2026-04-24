"use client";

import Link from "next/link";

import { RouteErrorState } from "@/components/layout/route-error-state";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function DisputesError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Failed to load disputes"
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
