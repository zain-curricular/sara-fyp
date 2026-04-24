// ============================================================================
// Buyer Order Detail Shell
// ============================================================================
//
// Timeline-first order detail view with real data. Shows:
// - Vertical status timeline
// - Order items with listing snapshots
// - Shipping address (shown after order accepted)
// - Tracking info (shown when shipped)
// - "Confirm Receipt" button (shown when delivered)
// - Links to dispute and review
//
// Data is passed from the RSC page.tsx via props — no client fetch needed.

"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/primitives/button";
import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/utils/currency";

import type { Order, OrderStatus } from "@/lib/features/orders/types";
import { useConfirmReceipt } from "@/lib/features/orders/hooks";

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

type OrderDetailShellProps = {
	order: Order;
};

// ----------------------------------------------------------------------------
// Status meta
// ----------------------------------------------------------------------------

const STATUS_META: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
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

// ----------------------------------------------------------------------------
// Timeline
// ----------------------------------------------------------------------------

type TimelineStep = {
	status: OrderStatus;
	label: string;
	timestamp: string | null;
	detail?: string;
};

function buildTimeline(order: Order): TimelineStep[] {
	return [
		{
			status: "pending_payment",
			label: "Order placed",
			timestamp: order.placedAt,
			detail: `${formatPKR(order.total)} held in escrow`,
		},
		{
			status: "paid_escrow",
			label: "Payment confirmed",
			timestamp: order.placedAt, // COD immediately transitions
			detail: `Paid via ${order.paymentMethod.toUpperCase()}`,
		},
		{
			status: "accepted",
			label: "Seller accepted",
			timestamp: order.acceptedAt,
		},
		{
			status: "shipped",
			label: "Shipped",
			timestamp: order.shippedAt,
			detail: order.trackingNumber
				? `${order.courierName ?? "Courier"} · ${order.trackingNumber}`
				: undefined,
		},
		{
			status: "delivered",
			label: "Delivered",
			timestamp: order.deliveredAt,
		},
		{
			status: "completed",
			label: "Completed",
			timestamp: order.completedAt,
			detail: "Payment released to seller",
		},
	];
}

const STATUS_ORDER: OrderStatus[] = [
	"pending_payment",
	"paid_escrow",
	"accepted",
	"shipped",
	"delivered",
	"completed",
];

function TimelineStep({
	step,
	currentStatus,
	isLast,
}: {
	step: TimelineStep;
	currentStatus: OrderStatus;
	isLast: boolean;
}) {
	const currentIdx = STATUS_ORDER.indexOf(currentStatus);
	const stepIdx = STATUS_ORDER.indexOf(step.status);

	const isDone = stepIdx < currentIdx || currentStatus === step.status && step.timestamp !== null;
	const isActive = step.status === currentStatus;
	const isPending = !isDone && !isActive;

	const formattedDate = step.timestamp
		? new Date(step.timestamp).toLocaleString("en-PK", {
				day: "numeric",
				month: "short",
				hour: "2-digit",
				minute: "2-digit",
			})
		: null;

	return (
		<div className="flex gap-3">
			<div className="flex flex-col items-center">
				<div
					className={cn(
						"flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
						isDone && "border-foreground bg-foreground text-background",
						isActive && "border-primary bg-primary text-primary-foreground",
						isPending && "border-border bg-background text-muted-foreground",
					)}
					aria-label={`${step.label}: ${isDone ? "done" : isActive ? "active" : "pending"}`}
				>
					{isDone ? <CheckCircle2 className="size-3" aria-hidden /> : null}
				</div>
				{!isLast && (
					<div
						className={cn("mt-1 w-0.5 flex-1", isDone ? "bg-foreground/30" : "bg-border")}
						style={{ minHeight: "28px" }}
						aria-hidden
					/>
				)}
			</div>

			<div className={cn("flex flex-col gap-0.5 pb-5", isLast && "pb-0")}>
				<div className="flex flex-wrap items-baseline gap-2">
					<p className={cn("text-sm font-semibold", isPending && "text-muted-foreground")}>
						{step.label}
					</p>
					{formattedDate && (
						<span className="text-xs text-muted-foreground">{formattedDate}</span>
					)}
				</div>
				{step.detail && (
					<p
						className={cn(
							"text-xs leading-relaxed",
							isPending ? "text-muted-foreground/60" : "text-muted-foreground",
						)}
					>
						{step.detail}
					</p>
				)}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function OrderDetailShell({ order }: OrderDetailShellProps) {
	const confirmReceipt = useConfirmReceipt();
	const statusMeta = STATUS_META[order.ssStatus];
	const timeline = buildTimeline(order);

	const firstItem = order.items[0];
	const titleSummary = firstItem?.listingSnapshot.title ?? "Order";

	const showConfirmReceipt = order.ssStatus === "delivered";
	const showReview = order.ssStatus === "completed";
	const showDispute = order.ssStatus === "delivered" || order.ssStatus === "disputed";

	return (
		<div container-id="order-detail-shell" className="flex flex-col gap-6">

			<Link
				href="/buyer/orders"
				className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 w-fit")}
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				My orders
			</Link>

			<header container-id="order-detail-header" className="flex flex-col gap-1">
				<p className="text-xs text-muted-foreground">
					order #{order.orderNumber}
				</p>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<h1 className="text-2xl font-bold leading-snug tracking-tight">
						{titleSummary}
						{order.items.length > 1 && (
							<span className="ml-2 text-base font-normal text-muted-foreground">
								+{order.items.length - 1} more
							</span>
						)}
					</h1>
					<div className="flex items-center gap-2">
						<Badge variant={statusMeta.variant} className="rounded-sm">
							{statusMeta.label}
						</Badge>
						<span className="text-xl font-bold tabular-nums text-primary">
							{formatPKR(order.total)}
						</span>
					</div>
				</div>
			</header>

			<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">

				<div className="flex flex-col gap-5">

					{/* Timeline */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Order timeline</CardTitle>
						</CardHeader>
						<CardContent>
							{timeline.map((step, i) => (
								<TimelineStep
									key={step.status}
									step={step}
									currentStatus={order.ssStatus}
									isLast={i === timeline.length - 1}
								/>
							))}
						</CardContent>
					</Card>

					{/* Items */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Items ordered</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-0">
							{order.items.map((item, i) => (
								<div key={item.id}>
									<div className="flex gap-4 py-3">
										<div className="aspect-square w-14 shrink-0 overflow-hidden rounded-md bg-muted/40">
											{item.listingSnapshot.imageUrl && (
												<img
													src={item.listingSnapshot.imageUrl}
													alt={item.listingSnapshot.title}
													className="h-full w-full object-cover"
												/>
											)}
										</div>
										<div className="flex min-w-0 flex-1 flex-col gap-0.5">
											<p className="text-sm font-semibold">{item.listingSnapshot.title}</p>
											{item.listingSnapshot.condition && (
												<p className="text-xs text-muted-foreground">
													Condition: {item.listingSnapshot.condition}
												</p>
											)}
											<p className="text-xs text-muted-foreground">
												{item.qty} × {formatPKR(item.unitPrice)}
											</p>
										</div>
										<span className="shrink-0 text-sm font-bold tabular-nums">
											{formatPKR(item.lineTotal)}
										</span>
									</div>
									{i < order.items.length - 1 && <Separator />}
								</div>
							))}
						</CardContent>
					</Card>

					{/* Shipping address — shown after accepted */}
					{(order.ssStatus === "accepted" ||
						order.ssStatus === "shipped" ||
						order.ssStatus === "delivered" ||
						order.ssStatus === "completed") && (
						<Card size="sm">
							<CardHeader>
								<CardTitle className="text-base">Shipping to</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-sm">
									<p className="font-semibold">{order.shippingAddress.fullName}</p>
									<p className="text-muted-foreground">{order.shippingAddress.phone}</p>
									<p className="text-muted-foreground">{order.shippingAddress.addressLine}</p>
									<p className="text-muted-foreground">
										{order.shippingAddress.city}, {order.shippingAddress.province}
									</p>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Tracking */}
					{order.trackingNumber && (
						<Card size="sm">
							<CardHeader>
								<CardTitle className="text-base">Tracking</CardTitle>
							</CardHeader>
							<CardContent className="text-sm">
								<p className="text-muted-foreground">
									{order.courierName && (
										<span className="font-medium text-foreground">{order.courierName} · </span>
									)}
									<span className="font-mono">{order.trackingNumber}</span>
								</p>
							</CardContent>
						</Card>
					)}
				</div>

				<div className="flex flex-col gap-4 lg:sticky lg:top-20">

					{/* Payment summary */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Payment summary</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-0">
							<div className="flex items-center justify-between py-2 text-sm">
								<span className="text-muted-foreground">Subtotal</span>
								<span className="tabular-nums">{formatPKR(order.subtotal)}</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between py-2 text-sm">
								<span className="text-muted-foreground">Shipping</span>
								<span className="tabular-nums">{formatPKR(order.shippingFee)}</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between py-2 text-sm">
								<span className="text-muted-foreground">Platform fee</span>
								<span className="tabular-nums text-muted-foreground">{formatPKR(order.platformFee)}</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between py-2.5">
								<span className="text-sm font-semibold">Total</span>
								<span className="text-base font-bold tabular-nums text-primary">
									{formatPKR(order.total)}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Escrow trust */}
					<Card size="sm" className="border-primary/20 bg-primary/5">
						<CardContent className="flex gap-3 pt-4">
							<ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
							<div className="flex flex-col gap-1">
								<p className="text-sm font-semibold">Escrow protected</p>
								<p className="text-xs leading-relaxed text-muted-foreground">
									Your money is held securely. You have{" "}
									<strong>14 days after delivery</strong> to approve or open a dispute.
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Actions */}
					<div container-id="order-detail-actions" className="flex flex-col gap-2">
						{showConfirmReceipt && (
							<Button
								type="button"
								className="w-full"
								disabled={confirmReceipt.isPending}
								onClick={() => confirmReceipt.mutate({ orderId: order.id })}
							>
								{confirmReceipt.isPending ? "Confirming…" : "✓ Confirm receipt & release payment"}
							</Button>
						)}

						{showReview && (
							<Link
								href={`/buyer/orders/${order.id}/review`}
								className={cn(buttonVariants({ variant: "outline" }), "w-full")}
							>
								Write a review
							</Link>
						)}

						{showDispute && (
							<Link
								href={`/buyer/orders/${order.id}/dispute`}
								className={cn(buttonVariants({ variant: "outline" }), "w-full")}
							>
								Open dispute
							</Link>
						)}

						<Link
							href={`/buyer/orders/${order.id}/track`}
							className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full")}
						>
							View tracking timeline
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
