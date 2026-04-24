"use client";

import Link from "next/link";

import { RouteErrorState } from "@/components/layout/route-error-state";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function SellerPublicError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			description="We could not load this seller. Check your connection and try again."
			error={error}
			reset={reset}
			title="Could not load seller"
			actions={
				<Link className={cn(buttonVariants())} href="/">
					Home
				</Link>
			}
		/>
	);
}
