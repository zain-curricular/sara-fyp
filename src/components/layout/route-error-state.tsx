"use client";

import { useEffect } from "react";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

type Props = {
	title: string;
	description?: string;
	error: Error & { digest?: string };
	reset: () => void;
	actions?: React.ReactNode;
};

/**
 * Route error UI: logs the error for debugging, shows a safe user-facing message (no raw `error.message`).
 */
export function RouteErrorState({
	title,
	description = "Check your connection and try again.",
	error,
	reset,
	actions,
}: Props) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
			<h2 className="text-lg font-semibold">{title}</h2>
			<p className="text-sm text-muted-foreground">{description}</p>
			<div className="flex flex-wrap gap-2">
				<button
					className={cn(buttonVariants({ variant: "outline" }))}
					type="button"
					onClick={() => reset()}
				>
					Try again
				</button>
				{actions}
			</div>
		</div>
	);
}
