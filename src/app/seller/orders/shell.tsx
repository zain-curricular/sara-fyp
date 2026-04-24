// ============================================================================
// Seller Orders Shell
// ============================================================================
//
// Tabbed orders management for sellers. Tabs: All, Pending, Accepted, Shipped,
// Completed, Disputed. Each order card shows: order number, buyer initials,
// item count, total, status, created time, and a View link.

"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/primitives/badge";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/utils/currency";

import type { Order, OrderStatus } from "@/lib/features/orders/types";
import { useSellerOrders } from "@/lib/features/orders/hooks";

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

type SellerOrdersShellProps = {
	initialOrders: Order[];
};

// ----------------------------------------------------------------------------
// Filter tabs
// ----------------------------------------------------------------------------

type TabKey = "all" | "pending" | "accepted" | "shipped" | "completed" | "disputed";

const TABS: { key: TabKey; label: string; statuses: OrderStatus[] }[] = [
	{ key: "all", label: "All", statuses: [] },
	{ key: "pending", label: "Pending", statuses: ["pending_payment", "paid_escrow"] },
	{ key: "accepted", label: "Accepted", statuses: ["accepted"] },
	{ key: "shipped", label: "Shipped", statuses: ["shipped", "delivered"] },
	{ key: "completed", label: "Completed", statuses: ["completed", "refunded"] },
	{ key: "disputed", label: "Disputed", statuses: ["disputed"] },
];

const STATUS_BADGE: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
	pending_payment: { label: "Pending payment", variant: "outline" },
	paid_escrow: { label: "Payment held", variant: "secondary" },
	accepted: { label: "Accepted", variant: "secondary" },
	shipped: { label: "Shipped", variant: "default" },
	delivered: { label: "Delivered", variant: "default" },
	completed: { label: "Completed", variant: "secondary" },
	disputed: { label: "Disputed", variant: "outline" },
	refunded: { label: "Refunded", variant: "secondary" },
	cancelled: { label: "Cancelled", variant: "outline" },
};

function matchesTab(order: Order, tab: TabKey): boolean {
	const t = TABS.find((t) => t.key === tab);
	if (!t || t.statuses.length === 0) return true;
	return t.statuses.includes(order.ssStatus);
}

// Buyer initials from buyer_id (fallback to first 2 chars of UUID)
function buyerInitials(id: string): string {
	return id.slice(0, 2).toUpperCase();
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function SellerOrdersShell({ initialOrders }: SellerOrdersShellProps) {
	const qc = useQueryClient();

	if (!qc.getQueryData(["orders", "seller", undefined])) {
		qc.setQueryData(["orders", "seller", undefined], initialOrders);
	}

	const { data: orders } = useSellerOrders();
	const allOrders = orders ?? initialOrders;

	const [activeTab, setActiveTab] = useState<TabKey>("all");
	const visible = allOrders.filter((o) => matchesTab(o, activeTab));

	return (
		<div container-id="seller-orders-shell" className="flex flex-col gap-6">

			<header container-id="seller-orders-header" className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-3xl font-bold tracking-tight">Orders</h1>
				<Badge variant="secondary" className="rounded-sm">
					{allOrders.length} total
				</Badge>
			</header>

			{/* Tabs */}
			<div container-id="seller-orders-tabs" className="flex flex-wrap gap-2">
				{TABS.map((tab) => {
					const count = allOrders.filter((o) => matchesTab(o, tab.key)).length;

					return (
						<button
							key={tab.key}
							type="button"
							onClick={() => setActiveTab(tab.key)}
							className={cn(
								"rounded-full border px-3 py-1 text-xs font-medium transition-colors",
								activeTab === tab.key
									? "border-primary bg-primary text-primary-foreground"
									: "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
							)}
						>
							{tab.label} ({count})
						</button>
					);
				})}
			</div>

			{/* Orders list */}
			<div container-id="seller-orders-list" className="flex flex-col gap-3">
				{visible.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
						<p className="text-sm font-medium">No orders in this category.</p>
					</div>
				) : (
					visible.map((order) => {
						const badge = STATUS_BADGE[order.ssStatus];
						const placedDate = new Date(order.placedAt).toLocaleString("en-PK", {
							day: "numeric",
							month: "short",
							hour: "2-digit",
							minute: "2-digit",
						});

						return (
							<Card key={order.id} size="sm" className="transition-colors hover:bg-accent/30">
								<CardContent className="flex items-center gap-4 py-4">

									{/* Buyer avatar */}
									<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
										{buyerInitials(order.buyerId)}
									</div>

									{/* Info */}
									<div className="flex min-w-0 flex-1 flex-col gap-1">
										<div className="flex flex-wrap items-center gap-1.5">
											<p className="text-sm font-semibold">#{order.orderNumber}</p>
											<Badge
												variant={badge.variant}
												className="shrink-0 rounded-sm text-[9px]"
											>
												{badge.label}
											</Badge>
										</div>

										<p className="text-xs text-muted-foreground">
											{order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
											{placedDate}
										</p>

										{order.ssStatus === "paid_escrow" && (
											<p className="text-xs font-medium text-primary">
												Action needed — accept this order
											</p>
										)}
									</div>

									{/* Right */}
									<div className="flex shrink-0 flex-col items-end gap-2">
										<span className="text-sm font-bold tabular-nums text-primary">
											{formatPKR(order.total)}
										</span>
										<Link
											href={`/seller/orders/${order.id}`}
											className={buttonVariants({ variant: "outline", size: "sm" })}
										>
											View ↗
										</Link>
									</div>
								</CardContent>
							</Card>
						);
					})
				)}
			</div>
		</div>
	);
}
