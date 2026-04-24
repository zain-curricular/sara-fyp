// ============================================================================
// Admin Order Detail Shell
// ============================================================================
//
// Full order detail with line items, shipping info, and force-cancel action.
// Force-cancel: POST /api/admin/orders/[id]/force-cancel { reason }

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { toast } from "sonner";

import type { AdminOrder } from "@/lib/features/admin";
import { formatPKR } from "@/lib/utils/currency";

import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { Textarea } from "@/components/primitives/textarea";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type DetailedOrder = AdminOrder & {
	subtotal: number;
	shippingFee: number;
	platformFee: number;
	items: Array<{ title: string; qty: number; unitPrice: number; lineTotal: number }>;
	shippingAddress: Record<string, unknown>;
	trackingNumber: string | null;
	courierName: string | null;
};

type Props = {
	order: DetailedOrder;
};

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminOrderDetailShell({ order }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [showCancelForm, setShowCancelForm] = useState(false);
	const [cancelReason, setCancelReason] = useState("");

	async function forceCancel() {
		if (!cancelReason.trim()) {
			toast.error("Please enter a reason");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`/api/admin/orders/${order.id}/force-cancel`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reason: cancelReason }),
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Order cancelled");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(false);
			setShowCancelForm(false);
			setCancelReason("");
		}
	}

	const addr = order.shippingAddress;

	return (
		<div container-id="admin-order-detail" className="flex flex-col gap-6">

			{/* Back */}
			<Link href="/admin/orders" className={buttonVariants({ variant: "ghost", size: "sm" })}>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to orders
			</Link>

			{/* Main card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="size-4" aria-hidden />
						Order {order.orderNumber}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">

					{/* Summary */}
					<div container-id="admin-order-summary" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-muted-foreground">Status</p>
							<Badge variant={order.ssStatus === "completed" ? "default" : order.ssStatus === "cancelled" ? "destructive" : "secondary"}>
								{order.ssStatus.replace(/_/g, " ")}
							</Badge>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Total</p>
							<p className="font-medium tabular-nums">{formatPKR(order.total)}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Placed</p>
							<p className="font-medium tabular-nums">
								{new Date(order.placedAt).toLocaleDateString("en-PK")}
							</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Subtotal</p>
							<p className="font-medium tabular-nums">{formatPKR(order.subtotal)}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Shipping</p>
							<p className="font-medium tabular-nums">{formatPKR(order.shippingFee)}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Platform fee</p>
							<p className="font-medium tabular-nums">{formatPKR(order.platformFee)}</p>
						</div>
						{order.courierName && (
							<div>
								<p className="text-xs text-muted-foreground">Courier</p>
								<p className="font-medium">{order.courierName}</p>
							</div>
						)}
						{order.trackingNumber && (
							<div>
								<p className="text-xs text-muted-foreground">Tracking</p>
								<p className="font-medium font-mono text-xs">{order.trackingNumber}</p>
							</div>
						)}
					</div>

					<Separator />

					{/* Shipping address */}
					{Object.keys(addr).length > 0 && (
						<div>
							<p className="mb-1 text-xs text-muted-foreground">Shipping address</p>
							<p className="text-sm">
								{[addr.line1, addr.line2, addr.city, addr.province, addr.postal_code]
									.filter(Boolean)
									.join(", ")}
							</p>
						</div>
					)}

					<Separator />

					{/* Line items */}
					<div>
						<p className="mb-2 text-xs text-muted-foreground">Items</p>
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border text-left text-xs text-muted-foreground">
									<th className="pb-2 pr-4 font-medium">Item</th>
									<th className="pb-2 pr-4 font-medium">Qty</th>
									<th className="pb-2 pr-4 font-medium">Unit price</th>
									<th className="pb-2 font-medium">Total</th>
								</tr>
							</thead>
							<tbody>
								{order.items.map((item, i) => (
									<tr key={i} className="border-b border-border/50 last:border-0">
										<td className="py-2 pr-4">{item.title}</td>
										<td className="py-2 pr-4 tabular-nums">{item.qty}</td>
										<td className="py-2 pr-4 tabular-nums">{formatPKR(item.unitPrice)}</td>
										<td className="py-2 tabular-nums">{formatPKR(item.lineTotal)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<Separator />

					{/* Force cancel */}
					{order.ssStatus !== "cancelled" && order.ssStatus !== "completed" && (
						<div container-id="admin-order-actions" className="flex flex-col gap-2">
							{!showCancelForm ? (
								<Button
									variant="destructive"
									size="sm"
									onClick={() => setShowCancelForm(true)}
									disabled={loading}
									className="w-fit"
								>
									Force cancel order
								</Button>
							) : (
								<div className="flex w-full max-w-sm flex-col gap-2">
									<Textarea
										placeholder="Reason for cancellation…"
										value={cancelReason}
										onChange={(e) => setCancelReason(e.target.value)}
										rows={2}
									/>
									<div className="flex gap-2">
										<Button
											variant="destructive"
											size="sm"
											onClick={forceCancel}
											disabled={loading || !cancelReason.trim()}
										>
											Confirm cancel
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												setShowCancelForm(false);
												setCancelReason("");
											}}
										>
											Abort
										</Button>
									</div>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
