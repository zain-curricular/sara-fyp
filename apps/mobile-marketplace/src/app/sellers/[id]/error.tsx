"use client";

import Link from "next/link";
import { useEffect } from "react";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function SellerPublicError({
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
			<h2 className="text-lg font-semibold">Could not load seller</h2>
			<p className="text-sm text-muted-foreground">{error.message}</p>
			<div className="flex flex-wrap gap-2">
				<button
					className={cn(buttonVariants({ variant: "outline" }))}
					type="button"
					onClick={() => reset()}
				>
					Try again
				</button>
				<Link className={cn(buttonVariants())} href="/">
					Home
				</Link>
			</div>
		</div>
	);
}
