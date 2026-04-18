"use client";

import Link from "next/link";
import { useEffect } from "react";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function AvatarSettingsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
			<h2 className="text-lg font-semibold">Something went wrong</h2>
			<p className="text-sm text-muted-foreground">{error.message}</p>
			<div className="flex flex-wrap gap-2">
				<button
					className={cn(buttonVariants({ variant: "outline" }))}
					type="button"
					onClick={() => reset()}
				>
					Try again
				</button>
				<Link className={cn(buttonVariants())} href="/buyer/settings/profile">
					Profile settings
				</Link>
			</div>
		</div>
	);
}
