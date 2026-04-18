"use client";

import Link from "next/link";
import { useEffect } from "react";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export default function LoginError({
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
		<div className="w-full max-w-sm space-y-4 rounded-xl border border-destructive/30 bg-card p-6">
			<h2 className="text-center text-lg font-semibold">Sign-in unavailable</h2>
			<p className="text-center text-sm text-muted-foreground">{error.message}</p>
			<div className="flex flex-col gap-2">
				<button
					className={cn(buttonVariants({ variant: "outline" }))}
					type="button"
					onClick={() => reset()}
				>
					Try again
				</button>
				<Link className={cn(buttonVariants(), "flex justify-center")} href="/">
					Home
				</Link>
			</div>
		</div>
	);
}
