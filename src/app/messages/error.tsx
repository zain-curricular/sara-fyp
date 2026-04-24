// ============================================================================
// /messages — Error Boundary
// ============================================================================
//
// Catches errors thrown by the messages RSC (auth failure, failed fetch).
// Provides a retry action that re-runs the server component.

"use client";

import { MessageSquareDashed } from "lucide-react";

import { Button } from "@/components/primitives/button";

export default function MessagesError({
	error: _error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div
			container-id="messages-error"
			className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center"
		>
			<MessageSquareDashed className="size-10 text-muted-foreground/30" aria-hidden />
			<div className="flex flex-col gap-1">
				<p className="text-base font-semibold">Failed to load messages</p>
				<p className="text-sm text-muted-foreground">
					Check your connection and try again.
				</p>
			</div>
			<Button variant="outline" size="sm" onClick={reset}>
				Try again
			</Button>
		</div>
	);
}
