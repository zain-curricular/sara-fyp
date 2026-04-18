"use client";

import { useEffect } from "react";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function BuyerError({
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
			<h2 className="text-lg font-semibold">Could not load buyer area</h2>
			<p className="text-sm text-muted-foreground">{error.message}</p>
			<button
				className={cn(buttonVariants({ variant: "outline" }))}
				type="button"
				onClick={() => reset()}
			>
				Try again
			</button>
		</div>
	);
}
