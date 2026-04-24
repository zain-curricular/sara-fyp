// ============================================================================
// Admin Disputes Shell
// ============================================================================
//
// Filterable table of disputes with status badges and link to detail.
// Status filter updates URL params.

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gavel } from "lucide-react";

import type { AdminDispute } from "@/lib/features/admin";

import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Props = {
	disputes: AdminDispute[];
	initialStatus: string;
};

// ----------------------------------------------------------------------------
// Status tabs
// ----------------------------------------------------------------------------

const STATUS_TABS = [
	{ value: "open", label: "Open" },
	{ value: "under_review", label: "Under Review" },
	{ value: "all", label: "All" },
	{ value: "resolved_buyer", label: "Resolved (Buyer)" },
	{ value: "resolved_seller", label: "Resolved (Seller)" },
] as const;

// ----------------------------------------------------------------------------
// Status badge
// ----------------------------------------------------------------------------

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
	if (s === "resolved_buyer" || s === "resolved_seller") return "default";
	if (s === "open") return "destructive";
	return "secondary";
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminDisputesShell({ disputes, initialStatus }: Props) {
	const router = useRouter();
	const [status, setStatus] = useState(initialStatus);

	function updateStatus(newStatus: string) {
		setStatus(newStatus);
		const params = new URLSearchParams();
		if (newStatus !== "all") params.set("status", newStatus);
		router.push(`/admin/disputes?${params.toString()}`);
	}

	return (
		<div container-id="admin-disputes" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="admin-disputes-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">Disputes</h1>
				<p className="text-sm text-muted-foreground">{disputes.length} result(s)</p>
			</header>

			{/* Status filter */}
			<div container-id="admin-disputes-filter" className="flex flex-wrap gap-1">
				{STATUS_TABS.map((tab) => (
					<Button
						key={tab.value}
						variant={status === tab.value ? "default" : "outline"}
						size="sm"
						onClick={() => updateStatus(tab.value)}
					>
						{tab.label}
					</Button>
				))}
			</div>

			{/* Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Gavel className="size-4" aria-hidden />
						Disputes
					</CardTitle>
				</CardHeader>
				<CardContent>
					{disputes.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">No disputes found.</p>
					) : (
						<div container-id="admin-disputes-table" className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border text-left text-xs text-muted-foreground">
										<th className="pb-2 pr-4 font-medium">Order #</th>
										<th className="pb-2 pr-4 font-medium">Reason</th>
										<th className="pb-2 pr-4 font-medium">Status</th>
										<th className="pb-2 pr-4 font-medium">Opened</th>
										<th className="pb-2" />
									</tr>
								</thead>
								<tbody>
									{disputes.map((dispute) => (
										<tr
											key={dispute.id}
											className="border-b border-border/50 last:border-0 hover:bg-muted/30"
										>
											<td className="py-3 pr-4 font-medium">{dispute.orderNumber}</td>
											<td className="py-3 pr-4 text-muted-foreground">
												{dispute.reason.replace(/_/g, " ")}
											</td>
											<td className="py-3 pr-4">
												<Badge variant={statusVariant(dispute.status)}>
													{dispute.status.replace(/_/g, " ")}
												</Badge>
											</td>
											<td className="py-3 pr-4 text-muted-foreground tabular-nums">
												{new Date(dispute.createdAt).toLocaleDateString("en-PK", {
													year: "numeric",
													month: "short",
													day: "numeric",
												})}
											</td>
											<td className="py-3 text-right">
												<Link
													href={`/admin/disputes/${dispute.id}`}
													className={buttonVariants({ variant: "ghost", size: "sm" })}
												>
													Resolve
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
