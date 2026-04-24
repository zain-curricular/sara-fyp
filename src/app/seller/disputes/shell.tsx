// ============================================================================
// Seller Disputes Shell
// ============================================================================
//
// List view: order number, reason badge, status badge, opened date, view link.

"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import type { Dispute } from "@/lib/features/disputes";
import { Badge } from "@/components/primitives/badge";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Config
// ----------------------------------------------------------------------------

const REASON_LABELS: Record<string, string> = {
	item_not_received: "Not received",
	item_not_as_described: "Not as described",
	damaged_item: "Damaged",
	wrong_item: "Wrong item",
	seller_unresponsive: "Unresponsive",
	other: "Other",
};

const STATUS_META: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
	open: { label: "Open", variant: "outline" },
	under_review: { label: "Under Review", variant: "secondary" },
	resolved: { label: "Resolved", variant: "default" },
	closed: { label: "Closed", variant: "secondary" },
};

function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
	} catch {
		return iso;
	}
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function SellerDisputesShell({ disputes }: { disputes: Dispute[] }) {
	return (
		<div container-id="seller-disputes-shell" className="flex flex-col gap-6">

			<header container-id="disputes-header" className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<AlertTriangle className="size-5 text-muted-foreground" aria-hidden />
					<h1 className="text-3xl font-bold tracking-tight">Disputes</h1>
				</div>
				<p className="text-sm text-muted-foreground">Buyer-raised disputes on your orders</p>
			</header>

			{disputes.length === 0 ? (
				<div
					container-id="disputes-empty"
					className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center"
				>
					<AlertTriangle className="size-10 text-muted-foreground/30" aria-hidden />
					<p className="text-sm font-medium">No disputes</p>
					<p className="text-xs text-muted-foreground">
						You have no open or past disputes.
					</p>
				</div>
			) : (
				<div container-id="disputes-list" className="flex flex-col gap-2">
					{disputes.map((dispute) => {
						const statusMeta = STATUS_META[dispute.status] ?? { label: dispute.status, variant: "secondary" as const };
						const reasonLabel = REASON_LABELS[dispute.reason] ?? dispute.reason;

						return (
							<Card key={dispute.id} size="sm">
								<CardContent className="flex items-center gap-3 py-3">
									<div className="flex min-w-0 flex-1 flex-col gap-1">
										<p className="text-sm font-semibold">
											Order #{dispute.order?.orderNumber ?? dispute.orderId.slice(0, 8)}
										</p>
										<div className="flex flex-wrap items-center gap-1.5">
											<Badge variant="outline" className="rounded-sm text-[10px]">
												{reasonLabel}
											</Badge>
											<Badge variant={statusMeta.variant} className="rounded-sm text-[10px]">
												{statusMeta.label}
											</Badge>
										</div>
										<p className="text-xs text-muted-foreground">
											Opened {formatDate(dispute.createdAt)}
										</p>
									</div>
									<Link
										href={`/seller/disputes/${dispute.id}`}
										className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
									>
										View
									</Link>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
