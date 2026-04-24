// ============================================================================
// Buyer Disputes List Shell — Client Component
// ============================================================================
//
// Lists buyer disputes with filter tabs (all / open / resolved).
// Status badges are color-coded. Each row links to the dispute detail.

"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import type { Dispute, DisputeStatus } from "@/lib/features/disputes";

import { Badge } from "@/components/primitives/badge";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/primitives/card";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

type FilterTab = "all" | "open" | "resolved";

function statusBadge(status: DisputeStatus) {
	switch (status) {
		case "open":
			return <Badge variant="destructive">Open</Badge>;
		case "under_review":
			return <Badge variant="outline">Under review</Badge>;
		case "resolved":
			return <Badge variant="default">Resolved</Badge>;
		case "closed":
			return <Badge variant="secondary">Closed</Badge>;
		default:
			return <Badge variant="secondary">{status}</Badge>;
	}
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("en-PK", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function humanReason(reason: string) {
	return reason
		.replace(/_/g, " ")
		.replace(/\b\w/g, (l) => l.toUpperCase());
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function DisputesListShell({
	disputes,
}: {
	disputes: Dispute[];
}) {
	const [filter, setFilter] = useState<FilterTab>("all");

	const filtered = disputes.filter((d) => {
		if (filter === "open") return d.status === "open" || d.status === "under_review";
		if (filter === "resolved") return d.status === "resolved" || d.status === "closed";
		return true;
	});

	return (
		<div
			container-id="disputes-list-shell"
			className="flex flex-col flex-1 min-h-0 p-4 relative overflow-auto gap-6"
		>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						My Disputes
					</h1>
					<p className="text-sm text-muted-foreground">
						Track your open and resolved disputes.
					</p>
				</div>
			</div>

			{/* Filter tabs */}
			<div
				container-id="disputes-filter-tabs"
				className="flex gap-2 border-b border-border"
			>
				{(["all", "open", "resolved"] as FilterTab[]).map((tab) => (
					<button
						key={tab}
						type="button"
						onClick={() => setFilter(tab)}
						className={`pb-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px px-1 ${
							filter === tab
								? "border-foreground text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
					>
						{tab}
					</button>
				))}
			</div>

			{/* List */}
			{filtered.length === 0 ? (
				<div
					container-id="disputes-empty"
					className="flex flex-col flex-1 min-h-0 items-center justify-center gap-4 rounded-xl border border-dashed border-muted-foreground/25 py-16"
				>
					<ShieldAlert className="size-8 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground">No disputes found</p>
				</div>
			) : (
				<div
					container-id="disputes-list"
					className="flex flex-col gap-3"
				>
					{filtered.map((dispute) => (
						<Card key={dispute.id} size="sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-sm">
									{humanReason(dispute.reason)}
									{statusBadge(dispute.status)}
								</CardTitle>
							</CardHeader>
							<CardContent className="flex items-center justify-between gap-4">
								<div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
									<span>Order {dispute.order?.orderNumber ?? dispute.orderId.slice(0, 8)}</span>
									<span>Opened {formatDate(dispute.createdAt)}</span>
								</div>
								<Link
									href={`/buyer/disputes/${dispute.id}`}
									className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
								>
									View
								</Link>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
