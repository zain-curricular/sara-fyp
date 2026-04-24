// ============================================================================
// Buyer Orders List Shell
// ============================================================================
//
// Timeline-card style orders list. Each order is a horizontal card with image
// placeholder, status badge, seller handle, and a sub-line surfacing the most
// actionable info. All data is placeholder — connect to orders API when ready.

"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Clock, Package, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/primitives/badge";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Placeholder data
// ----------------------------------------------------------------------------

type OrderStatus = "in_transit" | "delivered" | "completed" | "disputed";

type MockOrder = {
	id: string;
	item: string;
	seller: string;
	price: string;
	status: OrderStatus;
	sub: string;
};

const MOCK_ORDERS: MockOrder[] = [
	{
		id: "A-9421",
		item: "Alternator · Toyota Corolla 2019 · OEM",
		seller: "@zain_parts",
		price: "Rs 12,500",
		status: "in_transit",
		sub: "Arriving Thursday · TCS 4412-8821-00",
	},
	{
		id: "A-9388",
		item: "Brake Discs Set · Honda Civic",
		seller: "@karachi_auto",
		price: "Rs 8,200",
		status: "delivered",
		sub: "Tap to approve & release payment",
	},
	{
		id: "A-9212",
		item: "Head Gasket · Suzuki Mehran",
		seller: "@lahore_spares",
		price: "Rs 3,800",
		status: "completed",
		sub: "Done · warranty active for 3 months",
	},
	{
		id: "A-9144",
		item: "Radiator Fan · Toyota Prado",
		seller: "@rawalpindi_parts",
		price: "Rs 5,500",
		status: "completed",
		sub: "Done",
	},
];

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const STATUS_META: Record<
	OrderStatus,
	{ label: string; icon: React.ElementType; highlight: boolean }
> = {
	in_transit: { label: "In transit", icon: Package, highlight: true },
	delivered: { label: "Delivered", icon: CheckCircle2, highlight: true },
	completed: { label: "Completed", icon: CheckCircle2, highlight: false },
	disputed: { label: "Disputed", icon: ShieldAlert, highlight: true },
};

type FilterKey = "all" | "escrow" | "disputes";

const FILTERS: { key: FilterKey; label: string }[] = [
	{ key: "all", label: "All (12)" },
	{ key: "escrow", label: "In escrow (2)" },
	{ key: "disputes", label: "Disputes (0)" },
];

function matchesFilter(order: MockOrder, filter: FilterKey): boolean {
	if (filter === "all") return true;
	if (filter === "escrow") return order.status === "in_transit" || order.status === "delivered";
	if (filter === "disputes") return order.status === "disputed";
	return true;
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function OrdersShell() {
	const [filter, setFilter] = useState<FilterKey>("all");

	const visible = MOCK_ORDERS.filter((o) => matchesFilter(o, filter));

	return (
		<div container-id="orders-shell" className="flex flex-col gap-6">

			<header container-id="orders-header" className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-3xl font-bold tracking-tight">My orders</h1>
				<Badge variant="secondary" className="rounded-sm">
					2 need your action
				</Badge>
			</header>

			<div container-id="orders-filters" className="flex flex-wrap gap-2">
				{FILTERS.map(({ key, label }) => (
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
						{label}
					</button>
				))}
			</div>

			<div container-id="orders-list" className="flex flex-col gap-3">
				{visible.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
						<p className="text-sm font-medium">No orders here.</p>
					</div>
				) : (
					visible.map((order) => {
						const meta = STATUS_META[order.status];
						const StatusIcon = meta.icon;
						return (
							<Card key={order.id} size="sm" className="transition-colors hover:bg-accent/30">
								<CardContent className="flex items-center gap-4 py-4">
									<div className="aspect-square w-16 shrink-0 rounded-md bg-muted/40" />
									<div className="flex min-w-0 flex-1 flex-col gap-1">
										<div className="flex flex-wrap items-center gap-1.5">
											<p className="truncate text-sm font-semibold">{order.item}</p>
											<Badge
												variant={meta.highlight ? "default" : "secondary"}
												className="shrink-0 rounded-sm text-[9px]"
											>
												<StatusIcon className="size-2.5" aria-hidden />
												{meta.label}
											</Badge>
										</div>
										<p className="text-xs text-muted-foreground">
											#{order.id} · {order.seller}
										</p>
										<p className="flex items-center gap-1 text-xs font-medium">
											{order.status === "delivered" && (
												<Clock className="size-3 text-primary" aria-hidden />
											)}
											{order.sub}
										</p>
									</div>
									<div className="flex shrink-0 flex-col items-end gap-2">
										<span className="text-sm font-bold tabular-nums text-primary">
											{order.price}
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
