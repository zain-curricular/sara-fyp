"use client";

import Link from "next/link";

import { RouteErrorState } from "@/components/layout/route-error-state";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function AvatarSettingsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteErrorState
			description="Something went wrong while loading this page. Check your connection and try again."
			error={error}
			reset={reset}
			title="Something went wrong"
			actions={
				<Link className={cn(buttonVariants())} href="/buyer/settings/profile">
					Profile settings
				</Link>
			}
		/>
	);
}
