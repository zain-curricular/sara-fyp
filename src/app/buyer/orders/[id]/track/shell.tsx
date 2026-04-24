// ============================================================================
// Order Tracking Shell
// ============================================================================
//
// Realtime tracking timeline. Subscribes to the `order-events:{orderId}`
// Supabase Realtime channel so new status events appear without refresh.
// Initial events are SSR-hydrated; new events are appended live.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import type { Order, OrderStatusEvent } from "@/lib/features/orders/types";

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

type TrackingShellProps = {
	order: Order;
	initialEvents: OrderStatusEvent[];
};

// ----------------------------------------------------------------------------
// Status label map
// ----------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
	pending_payment: "Order placed",
	paid_escrow: "Payment confirmed",
	accepted: "Seller accepted",
	shipped: "Shipped",
	delivered: "Delivered",
	completed: "Completed — escrow released",
	disputed: "Dispute opened",
	refunded: "Refunded",
	cancelled: "Cancelled",
};

// ----------------------------------------------------------------------------
// Timeline event row
// ----------------------------------------------------------------------------

function EventRow({ event, isLast }: { event: OrderStatusEvent; isLast: boolean }) {
	const label = STATUS_LABELS[event.toStatus] ?? event.toStatus;
	const date = new Date(event.createdAt).toLocaleString("en-PK", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});

	return (
		<div className="flex gap-3">
			<div className="flex flex-col items-center">
				<div className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-foreground text-background">
					<CheckCircle2 className="size-3" aria-hidden />
				</div>
				{!isLast && (
					<div className="mt-1 w-0.5 flex-1 bg-foreground/20" style={{ minHeight: "28px" }} aria-hidden />
				)}
			</div>

			<div className={cn("flex flex-col gap-0.5 pb-5", isLast && "pb-0")}>
				<div className="flex flex-wrap items-baseline gap-2">
					<p className="text-sm font-semibold">{label}</p>
					<span className="text-xs text-muted-foreground">{date}</span>
				</div>
				{event.note && (
					<p className="text-xs text-muted-foreground">{event.note}</p>
				)}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function TrackingShell({ order, initialEvents }: TrackingShellProps) {
	const [events, setEvents] = useState<OrderStatusEvent[]>(initialEvents);

	// Subscribe to Realtime channel for live updates
	useEffect(() => {
		const supabase = createBrowserSupabaseClient();

		const channel = supabase
			.channel(`order-events:${order.id}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "order_status_events",
					filter: `order_id=eq.${order.id}`,
				},
				(payload) => {
					const row = payload.new as Record<string, unknown>;
					const newEvent: OrderStatusEvent = {
						id: row.id as string,
						orderId: row.order_id as string,
						fromStatus: (row.from_status as string | null) ?? null,
						toStatus: row.to_status as string,
						actorId: row.actor_id as string,
						note: (row.note as string | null) ?? null,
						createdAt: row.created_at as string,
					} as OrderStatusEvent;

					setEvents((prev) => [...prev, newEvent]);
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [order.id]);

	return (
		<div container-id="tracking-shell" className="flex flex-col gap-6">

			<Link
				href={`/buyer/orders/${order.id}`}
				className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 w-fit")}
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				Order detail
			</Link>

			<header className="flex flex-col gap-1">
				<p className="text-xs text-muted-foreground">
					Tracking — {order.orderNumber}
				</p>
				<h1 className="text-2xl font-bold tracking-tight">Order timeline</h1>
			</header>

			{order.trackingNumber && (
				<div className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3 text-sm">
					<p className="font-semibold">
						{order.courierName ?? "Courier"}
					</p>
					<p className="font-mono text-muted-foreground">{order.trackingNumber}</p>
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between text-base">
						<span>Status events</span>
						<span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-label="Live" />
					</CardTitle>
				</CardHeader>

				<CardContent>
					{events.length === 0 ? (
						<p className="text-sm text-muted-foreground">No events yet.</p>
					) : (
						events.map((event, i) => (
							<EventRow
								key={event.id}
								event={event}
								isLast={i === events.length - 1}
							/>
						))
					)}
				</CardContent>
			</Card>
		</div>
	);
}
