"use client";

import Link from "next/link";

import { RouteErrorState } from "@/components/layout/route-error-state";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function MechanicRequestDetailError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			title="Failed to load verification request"
			error={error}
			reset={reset}
			actions={
				<Link className={cn(buttonVariants())} href="/buyer/mechanic-requests">
					Back to requests
				</Link>
			}
		/>
	);
}
