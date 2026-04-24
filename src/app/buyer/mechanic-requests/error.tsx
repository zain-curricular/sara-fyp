"use client";

import Link from "next/link";

import { RouteErrorState } from "@/components/layout/route-error-state";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function MechanicRequestsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Failed to load verification requests"
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
