// ============================================================================
// Admin Orders Shell
// ============================================================================
//
// Filterable table of orders with status badges and link to detail.
// Status filter pushes to URL params to re-run the RSC.

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";

import type { AdminOrder } from "@/lib/features/admin";
import { formatPKR } from "@/lib/utils/currency";

import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Props = {
	orders: AdminOrder[];
	initialStatus: string;
};

// ----------------------------------------------------------------------------
// Status tabs
// ----------------------------------------------------------------------------

const STATUS_TABS = [
	{ value: "all", label: "All" },
	{ value: "pending", label: "Pending" },
	{ value: "confirmed", label: "Confirmed" },
	{ value: "shipped", label: "Shipped" },
	{ value: "delivered", label: "Delivered" },
	{ value: "completed", label: "Completed" },
	{ value: "cancelled", label: "Cancelled" },
	{ value: "refunded", label: "Refunded" },
] as const;

// ----------------------------------------------------------------------------
// Status badge
// ----------------------------------------------------------------------------

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
	if (s === "completed" || s === "delivered") return "default";
	if (s === "cancelled" || s === "refunded") return "destructive";
	return "secondary";
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminOrdersShell({ orders, initialStatus }: Props) {
	const router = useRouter();
	const [status, setStatus] = useState(initialStatus);

	function updateStatus(newStatus: string) {
		setStatus(newStatus);
		const params = new URLSearchParams();
		if (newStatus !== "all") params.set("status", newStatus);
		router.push(`/admin/orders?${params.toString()}`);
	}

	return (
		<div container-id="admin-orders" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="admin-orders-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">Orders</h1>
				<p className="text-sm text-muted-foreground">{orders.length} result(s)</p>
			</header>

			{/* Status filter */}
			<div container-id="admin-orders-filter" className="flex flex-wrap gap-1">
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
						<BarChart3 className="size-4" aria-hidden />
						Orders
					</CardTitle>
				</CardHeader>
				<CardContent>
					{orders.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">No orders found.</p>
					) : (
						<div container-id="admin-orders-table" className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border text-left text-xs text-muted-foreground">
										<th className="pb-2 pr-4 font-medium">Order #</th>
										<th className="pb-2 pr-4 font-medium">Total</th>
										<th className="pb-2 pr-4 font-medium">Status</th>
										<th className="pb-2 pr-4 font-medium">Placed</th>
										<th className="pb-2" />
									</tr>
								</thead>
								<tbody>
									{orders.map((order) => (
										<tr
											key={order.id}
											className="border-b border-border/50 last:border-0 hover:bg-muted/30"
										>
											<td className="py-3 pr-4 font-medium">{order.orderNumber}</td>
											<td className="py-3 pr-4 tabular-nums">{formatPKR(order.total)}</td>
											<td className="py-3 pr-4">
												<Badge variant={statusVariant(order.ssStatus)}>
													{order.ssStatus.replace(/_/g, " ")}
												</Badge>
											</td>
											<td className="py-3 pr-4 text-muted-foreground tabular-nums">
												{new Date(order.placedAt).toLocaleDateString("en-PK", {
													year: "numeric",
													month: "short",
													day: "numeric",
												})}
											</td>
											<td className="py-3 text-right">
												<Link
													href={`/admin/orders/${order.id}`}
													className={buttonVariants({ variant: "ghost", size: "sm" })}
												>
													View
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
