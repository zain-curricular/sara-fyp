// ============================================================================
// Admin Error Boundary
// ============================================================================
//
// Catches errors thrown by admin RSCs. Renders a user-friendly error state
// with a retry button that re-runs the server component.

"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";

export default function AdminError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div
			container-id="admin-error"
			className="flex flex-1 flex-col items-center justify-center p-8"
		>
			<Card className="w-full max-w-md">
				<CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
					<AlertCircle className="size-10 text-destructive" aria-hidden />
					<div className="flex flex-col gap-1">
						<h2 className="text-lg font-semibold">Something went wrong</h2>
						<p className="text-sm text-muted-foreground">
							{error.message ?? "An unexpected error occurred. Please try again."}
						</p>
					</div>
					<Button variant="outline" onClick={reset} className="gap-2">
						<RefreshCcw className="size-4" aria-hidden />
						Try again
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
