// ============================================================================
// /messages — Loading Skeleton
// ============================================================================
//
// Renders immediately while the RSC fetches the conversation list.
// Mirrors the two-panel MessagesShell layout so there is zero layout shift.

import { Skeleton } from "@/components/primitives/skeleton";

// Skeleton for a single conversation row
function ConversationRowSkeleton() {
	return (
		<div className="flex items-start gap-3 px-3 py-3">
			<Skeleton className="size-9 shrink-0 rounded-full" />
			<div className="flex flex-1 flex-col gap-1.5">
				<div className="flex items-center justify-between gap-2">
					<Skeleton className="h-3.5 w-28" />
					<Skeleton className="h-3 w-8" />
				</div>
				<Skeleton className="h-3 w-40" />
				<Skeleton className="h-3 w-24" />
			</div>
		</div>
	);
}

// Skeleton for a single message bubble
function MessageBubbleSkeleton({ align }: { align: "left" | "right" }) {
	return (
		<div className={`flex ${align === "right" ? "flex-row-reverse" : ""}`}>
			<Skeleton
				className={`h-10 rounded-2xl ${align === "right" ? "w-1/2" : "w-2/3"}`}
			/>
		</div>
	);
}

export default function MessagesLoading() {
	return (
		<div container-id="messages-shell" className="flex flex-col gap-4">

			{/* Header skeleton */}
			<div className="flex items-center gap-2">
				<Skeleton className="h-9 w-36" />
				<Skeleton className="h-6 w-16 rounded-sm" />
			</div>

			{/* Two-panel grid skeleton */}
			<div className="overflow-hidden rounded-xl border border-border lg:grid lg:h-[600px] lg:grid-cols-[300px_minmax(0,1fr)]">

				{/* Conversation list */}
				<div container-id="messages-list-skeleton" className="flex flex-col border-r border-border">
					<ConversationRowSkeleton />
					<div className="h-px bg-border" />
					<ConversationRowSkeleton />
					<div className="h-px bg-border" />
					<ConversationRowSkeleton />
					<div className="h-px bg-border" />
					<ConversationRowSkeleton />
				</div>

				{/* Thread skeleton */}
				<div
					container-id="messages-thread-skeleton"
					className="hidden flex-col lg:flex"
				>
					{/* Thread header */}
					<div className="flex items-center gap-3 border-b border-border px-4 py-3">
						<Skeleton className="size-8 rounded-full" />
						<div className="flex flex-col gap-1">
							<Skeleton className="h-3.5 w-32" />
							<Skeleton className="h-3 w-20" />
						</div>
					</div>

					{/* Messages */}
					<div className="flex flex-col gap-3 p-4">
						<MessageBubbleSkeleton align="left" />
						<MessageBubbleSkeleton align="right" />
						<MessageBubbleSkeleton align="left" />
						<MessageBubbleSkeleton align="right" />
					</div>
				</div>
			</div>
		</div>
	);
}
