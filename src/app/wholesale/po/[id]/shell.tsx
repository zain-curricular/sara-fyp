// ============================================================================
// Purchase Order Detail Shell
// ============================================================================
//
// Client shell for the PO detail page. Renders the order data passed from the
// RSC. Read-only — mutations are handled by the buyer/orders flow.

"use client";

import { Badge } from "@/components/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { formatPKR } from "@/lib/utils/currency";

type OrderItem = {
	id: string;
	quantity: number;
	unit_price: number;
	listing: {
		title: string;
		price: number;
	} | null;
};

type Order = {
	id: string;
	status: string;
	total_amount: number;
	created_at: string;
	order_items: OrderItem[];
};

type PODetailShellProps = {
	order: Order;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
	pending: "secondary",
	confirmed: "default",
	shipped: "default",
	delivered: "default",
	cancelled: "destructive",
};

/** Read-only purchase order detail view. */
export default function PODetailShell({ order }: PODetailShellProps) {
	const statusVariant = STATUS_VARIANT[order.status] ?? "outline";

	return (
		<div container-id="po-detail-shell" className="flex flex-col flex-1 min-h-0 p-4 gap-6">

			{/* PO Header */}
			<header container-id="po-header" className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
						Purchase Order
					</p>
					<h1 className="text-2xl font-bold tracking-tight font-mono">
						#{order.id.slice(0, 8).toUpperCase()}
					</h1>
					<p className="text-xs text-muted-foreground">
						Placed {new Date(order.created_at).toLocaleDateString("en-PK", {
							day: "numeric",
							month: "long",
							year: "numeric",
						})}
					</p>
				</div>
				<Badge variant={statusVariant} className="capitalize text-sm px-3 py-1">
					{order.status}
				</Badge>
			</header>

			{/* Items table */}
			<Card container-id="po-items-card">
				<CardHeader>
					<CardTitle className="text-base">Order Items</CardTitle>
				</CardHeader>
				<CardContent container-id="po-items-table">
					<div className="flex flex-col gap-0">

						{/* Table head */}
						<div className="grid grid-cols-[1fr_auto_auto] gap-4 pb-2 border-b border-border">
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Part</span>
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Qty</span>
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Price</span>
						</div>

						{/* Rows */}
						{order.order_items.map((item) => (
							<div
								key={item.id}
								container-id={`po-item-${item.id}`}
								className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 border-b border-border last:border-0"
							>
								<span className="text-sm font-medium">
									{item.listing?.title ?? "Unknown part"}
								</span>
								<span className="text-sm text-right text-muted-foreground">
									×{item.quantity}
								</span>
								<span className="text-sm font-medium text-right">
									{formatPKR((item.unit_price ?? item.listing?.price ?? 0) * item.quantity)}
								</span>
							</div>
						))}

						{/* Total row */}
						<div className="grid grid-cols-[1fr_auto] gap-4 pt-3">
							<span className="text-sm font-semibold">Total</span>
							<span className="text-sm font-bold text-right">
								{formatPKR(order.total_amount)}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
