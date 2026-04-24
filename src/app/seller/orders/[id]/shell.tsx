// ============================================================================
// Seller Order Detail Shell
// ============================================================================
//
// Order management view for sellers. Shows:
// - Order items with snapshot data
// - Buyer's shipping address (visible after accepted)
// - Total breakdown
// - Status actions:
//   - "Accept" button (paid_escrow → accepted)
//   - "Mark Shipped" form (accepted → shipped, requires tracking + courier)
// - Dispute info if applicable

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { Separator } from "@/components/primitives/separator";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/utils/currency";

import type { Order, OrderStatus } from "@/lib/features/orders/types";
import { shipOrderSchema } from "@/lib/features/orders/schemas";
import type { ShipOrderInput } from "@/lib/features/orders/schemas";
import { useAcceptOrder, useShipOrder } from "@/lib/features/orders/hooks";

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

type SellerOrderDetailShellProps = {
	order: Order;
};

// ----------------------------------------------------------------------------
// Status meta
// ----------------------------------------------------------------------------

const STATUS_BADGE: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
	pending_payment: { label: "Pending payment", variant: "outline" },
	paid_escrow: { label: "Payment held — action needed", variant: "default" },
	accepted: { label: "Accepted", variant: "secondary" },
	shipped: { label: "Shipped", variant: "default" },
	delivered: { label: "Delivered", variant: "default" },
	completed: { label: "Completed", variant: "secondary" },
	disputed: { label: "Disputed", variant: "outline" },
	refunded: { label: "Refunded", variant: "secondary" },
	cancelled: { label: "Cancelled", variant: "outline" },
};

// ----------------------------------------------------------------------------
// Ship form
// ----------------------------------------------------------------------------

type ShipFormProps = {
	orderId: string;
	onDone: () => void;
};

function ShipForm({ orderId, onDone }: ShipFormProps) {
	const shipOrder = useShipOrder();
	const [error, setError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ShipOrderInput>({
		resolver: zodResolver(shipOrderSchema),
	});

	async function onSubmit(data: ShipOrderInput) {
		setError(null);
		try {
			await shipOrder.mutateAsync({ orderId, ...data });
			onDone();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to mark as shipped");
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="courierName">Courier name</Label>
				<Input id="courierName" {...register("courierName")} placeholder="TCS, Leopard, M&P…" />
				{errors.courierName && (
					<p className="text-xs text-destructive">{errors.courierName.message}</p>
				)}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="trackingNumber">Tracking number</Label>
				<Input id="trackingNumber" {...register("trackingNumber")} placeholder="Track-1234567890" />
				{errors.trackingNumber && (
					<p className="text-xs text-destructive">{errors.trackingNumber.message}</p>
				)}
			</div>

			{error && (
				<p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
			)}

			<div className="flex gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={onDone}
					disabled={shipOrder.isPending}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={shipOrder.isPending}>
					{shipOrder.isPending ? "Marking shipped…" : "Mark as shipped"}
				</Button>
			</div>
		</form>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function SellerOrderDetailShell({ order }: SellerOrderDetailShellProps) {
	const acceptOrder = useAcceptOrder();
	const [showShipForm, setShowShipForm] = useState(false);
	const [acceptError, setAcceptError] = useState<string | null>(null);

	const badge = STATUS_BADGE[order.ssStatus];
	const showAccept = order.ssStatus === "paid_escrow";
	const showShip = order.ssStatus === "accepted";
	const showShippingAddress =
		order.ssStatus !== "pending_payment" && order.ssStatus !== "paid_escrow";

	async function handleAccept() {
		setAcceptError(null);
		try {
			await acceptOrder.mutateAsync({ orderId: order.id });
		} catch (e) {
			setAcceptError(e instanceof Error ? e.message : "Failed to accept order");
		}
	}

	return (
		<div container-id="seller-order-detail-shell" className="flex flex-col gap-6">

			<Link
				href="/seller/orders"
				className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 w-fit")}
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				My orders
			</Link>

			<header container-id="seller-order-detail-header" className="flex flex-col gap-1">
				<p className="text-xs text-muted-foreground">
					order #{order.orderNumber}
				</p>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<h1 className="text-2xl font-bold leading-snug tracking-tight">
						Order detail
					</h1>
					<div className="flex items-center gap-2">
						<Badge variant={badge.variant} className="rounded-sm">
							{badge.label}
						</Badge>
						<span className="text-xl font-bold tabular-nums text-primary">
							{formatPKR(order.total)}
						</span>
					</div>
				</div>
			</header>

			<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">

				<div className="flex flex-col gap-5">

					{/* Items */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Items</CardTitle>
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

					{/* Shipping address — visible after accepted */}
					{showShippingAddress && (
						<Card size="sm">
							<CardHeader>
								<CardTitle className="text-base">Ship to</CardTitle>
							</CardHeader>
							<CardContent className="text-sm">
								<p className="font-semibold">{order.shippingAddress.fullName}</p>
								<p className="text-muted-foreground">{order.shippingAddress.phone}</p>
								<p className="text-muted-foreground">{order.shippingAddress.addressLine}</p>
								<p className="text-muted-foreground">
									{order.shippingAddress.city}, {order.shippingAddress.province}
								</p>
							</CardContent>
						</Card>
					)}

					{/* Dispute notice */}
					{order.ssStatus === "disputed" && (
						<Card size="sm" className="border-destructive/30 bg-destructive/5">
							<CardContent className="pt-4">
								<p className="text-sm font-semibold text-destructive">Dispute raised</p>
								<p className="mt-1 text-xs text-muted-foreground">
									The buyer has opened a dispute for this order. Our support team will
									review and reach out within 48 hours.
								</p>
							</CardContent>
						</Card>
					)}

					{/* Ship form */}
					{showShip && showShipForm && (
						<Card size="sm">
							<CardHeader>
								<CardTitle className="text-base">Shipping details</CardTitle>
							</CardHeader>
							<CardContent>
								<ShipForm
									orderId={order.id}
									onDone={() => setShowShipForm(false)}
								/>
							</CardContent>
						</Card>
					)}
				</div>

				<div className="flex flex-col gap-4 lg:sticky lg:top-20">

					{/* Totals */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Order total</CardTitle>
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
								<span className="tabular-nums text-muted-foreground">
									{formatPKR(order.platformFee)}
								</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between py-2.5">
								<span className="text-sm font-semibold">Total</span>
								<span className="text-base font-bold tabular-nums text-primary">
									{formatPKR(order.total)}
								</span>
							</div>

							<p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
								You receive {formatPKR(order.subtotal)} after platform fee deduction,
								released when buyer confirms receipt.
							</p>
						</CardContent>
					</Card>

					{/* Actions */}
					<div container-id="seller-order-actions" className="flex flex-col gap-2">
						{showAccept && (
							<>
								<Button
									type="button"
									className="w-full"
									disabled={acceptOrder.isPending}
									onClick={handleAccept}
								>
									{acceptOrder.isPending ? "Accepting…" : "Accept order"}
								</Button>
								{acceptError && (
									<p className="text-xs text-destructive">{acceptError}</p>
								)}
							</>
						)}

						{showShip && !showShipForm && (
							<Button
								type="button"
								className="w-full"
								onClick={() => setShowShipForm(true)}
							>
								Mark as shipped
							</Button>
						)}

						{order.trackingNumber && (
							<div className="rounded-md border border-border px-3 py-2 text-xs">
								<p className="font-medium">Tracking</p>
								<p className="font-mono text-muted-foreground">
									{order.courierName && `${order.courierName} · `}
									{order.trackingNumber}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
