// ============================================================================
// Buyer Orders List Shell
// ============================================================================
//
// Timeline-card style orders list with real data. Orders are fetched SSR and
// passed as initialOrders; the useBuyerOrders hook refreshes client-side.
// Filter tabs by status group. Each card shows: item summary, seller,
// price, status badge, and a link to the order detail page.

"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Clock, Package, ShieldAlert, ShoppingBag } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/primitives/badge";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/utils/currency";

import type { Order, OrderStatus } from "@/lib/features/orders/types";
import { useBuyerOrders } from "@/lib/features/orders/hooks";

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

type OrdersShellProps = {
	initialOrders: Order[];
};

// ----------------------------------------------------------------------------
// Status meta
// ----------------------------------------------------------------------------

type FilterKey = "all" | "active" | "completed" | "disputed";

const FILTERS: { key: FilterKey; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "active", label: "In progress" },
	{ key: "completed", label: "Completed" },
	{ key: "disputed", label: "Disputes" },
];

const ACTIVE_STATUSES: OrderStatus[] = [
	"pending_payment",
	"paid_escrow",
	"accepted",
	"shipped",
	"delivered",
];

const STATUS_ICON: Record<OrderStatus, React.ElementType> = {
	pending_payment: Clock,
	paid_escrow: Clock,
	accepted: Clock,
	shipped: Package,
	delivered: CheckCircle2,
	completed: CheckCircle2,
	disputed: ShieldAlert,
	refunded: CheckCircle2,
	cancelled: ShieldAlert,
};

const STATUS_LABEL: Record<OrderStatus, string> = {
	pending_payment: "Pending",
	paid_escrow: "Payment held",
	accepted: "Accepted",
	shipped: "In transit",
	delivered: "Delivered",
	completed: "Completed",
	disputed: "Disputed",
	refunded: "Refunded",
	cancelled: "Cancelled",
};

function matchesFilter(order: Order, filter: FilterKey): boolean {
	if (filter === "all") return true;
	if (filter === "active") return ACTIVE_STATUSES.includes(order.ssStatus);
	if (filter === "completed") return order.ssStatus === "completed" || order.ssStatus === "refunded";
	if (filter === "disputed") return order.ssStatus === "disputed";
	return true;
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function OrdersShell({ initialOrders }: OrdersShellProps) {
	const qc = useQueryClient();

	// Hydrate RQ cache with SSR data
	if (!qc.getQueryData(["orders", "buyer", undefined])) {
		qc.setQueryData(["orders", "buyer", undefined], initialOrders);
	}

	const { data: orders } = useBuyerOrders();
	const allOrders = orders ?? initialOrders;

	const [filter, setFilter] = useState<FilterKey>("all");
	const visible = allOrders.filter((o) => matchesFilter(o, filter));

	const actionNeeded = allOrders.filter(
		(o) => o.ssStatus === "delivered",
	).length;

	return (
		<div container-id="orders-shell" className="flex flex-col gap-6">

			<header container-id="orders-header" className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-3xl font-bold tracking-tight">My orders</h1>
				{actionNeeded > 0 && (
					<Badge variant="secondary" className="rounded-sm">
						{actionNeeded} need your action
					</Badge>
				)}
			</header>

			<div container-id="orders-filters" className="flex flex-wrap gap-2">
				{FILTERS.map(({ key, label }) => {
					const count = allOrders.filter((o) => matchesFilter(o, key)).length;

					return (
						<button
							key={key}
							type="button"
							onClick={() => setFilter(key)}
							className={cn(
								"rounded-full border px-3 py-1 text-xs font-medium transition-colors",
								filter === key
									? "border-primary bg-primary text-primary-foreground"
									: "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
							)}
						>
							{label} ({count})
						</button>
					);
				})}
			</div>

			<div container-id="orders-list" className="flex flex-col gap-3">
				{visible.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
						<ShoppingBag className="size-8 text-muted-foreground/40" aria-hidden />
						<p className="text-sm font-medium">No orders here.</p>
					</div>
				) : (
					visible.map((order) => {
						const StatusIcon = STATUS_ICON[order.ssStatus];
						const statusLabel = STATUS_LABEL[order.ssStatus];
						const isHighlight = ["shipped", "delivered", "disputed"].includes(order.ssStatus);

						const firstItem = order.items[0];
						const itemTitle = firstItem?.listingSnapshot.title ?? "Order";
						const itemImage = firstItem?.listingSnapshot.imageUrl;

						return (
							<Card key={order.id} size="sm" className="transition-colors hover:bg-accent/30">
								<CardContent className="flex items-center gap-4 py-4">

									{/* Thumbnail */}
									<div className="aspect-square w-16 shrink-0 overflow-hidden rounded-md bg-muted/40">
										{itemImage && (
											<img src={itemImage} alt={itemTitle} className="h-full w-full object-cover" />
										)}
									</div>

									{/* Info */}
									<div className="flex min-w-0 flex-1 flex-col gap-1">
										<div className="flex flex-wrap items-center gap-1.5">
											<p className="truncate text-sm font-semibold">
												{itemTitle}
												{order.items.length > 1 && (
													<span className="ml-1 text-muted-foreground">
														+{order.items.length - 1}
													</span>
												)}
											</p>
											<Badge
												variant={isHighlight ? "default" : "secondary"}
												className="shrink-0 rounded-sm text-[9px]"
											>
												<StatusIcon className="size-2.5" aria-hidden />
												{statusLabel}
											</Badge>
										</div>

										<p className="text-xs text-muted-foreground">
											#{order.orderNumber} ·{" "}
											{order.store?.storeName ?? "Unknown store"}
										</p>

										{order.ssStatus === "delivered" && (
											<p className="flex items-center gap-1 text-xs font-medium text-primary">
												<Clock className="size-3" aria-hidden />
												Confirm receipt to release payment
											</p>
										)}

										{order.trackingNumber && order.ssStatus === "shipped" && (
											<p className="text-xs text-muted-foreground">
												{order.courierName && `${order.courierName} · `}
												<span className="font-mono">{order.trackingNumber}</span>
											</p>
										)}
									</div>

									{/* Right */}
									<div className="flex shrink-0 flex-col items-end gap-2">
										<span className="text-sm font-bold tabular-nums text-primary">
											{formatPKR(order.total)}
										</span>
										<Link
											href={`/buyer/orders/${order.id}`}
											className={buttonVariants({ variant: "outline", size: "sm" })}
										>
											Open ↗
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
