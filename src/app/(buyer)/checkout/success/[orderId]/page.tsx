// ============================================================================
// Checkout Success Page
// ============================================================================
//
// Post-order success screen. Fetches the placed order to show confirmation
// details: order number, items, total, and navigation links.

import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { getServerSession } from "@/lib/auth/guards";
import { getOrderDetail } from "@/lib/features/orders/services";
import { formatPKR } from "@/lib/utils/currency";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { cn } from "@/lib/utils";

type PageProps = {
	params: Promise<{ orderId: string }>;
};

export const metadata = { title: "Order Placed — ShopSmart" };

export default async function CheckoutSuccessPage({ params }: PageProps) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");

	const { orderId } = await params;
	const { data: order } = await getOrderDetail(orderId, session.userId);

	if (!order) redirect("/buyer/orders");

	return (
		<div container-id="checkout-success" className="mx-auto flex max-w-lg flex-col gap-8 py-10 text-center">

			{/* Icon */}
			<div className="flex flex-col items-center gap-3">
				<div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
					<CheckCircle2 className="size-8 text-primary" aria-hidden />
				</div>
				<h1 className="text-2xl font-bold tracking-tight">Order placed!</h1>
				<p className="text-muted-foreground">
					Order number{" "}
					<span className="font-mono font-semibold text-foreground">
						{order.orderNumber}
					</span>
				</p>
			</div>

			{/* Order summary */}
			<Card>
				<CardContent className="flex flex-col gap-3 pt-4">
					{order.items.map((item) => (
						<div key={item.id} className="flex items-center gap-3">
							<div className="aspect-square w-10 shrink-0 overflow-hidden rounded bg-muted/40">
								{item.listingSnapshot.imageUrl && (
									<img
										src={item.listingSnapshot.imageUrl}
										alt={item.listingSnapshot.title}
										className="h-full w-full object-cover"
									/>
								)}
							</div>
							<div className="min-w-0 flex-1 text-left">
								<p className="truncate text-sm font-medium">{item.listingSnapshot.title}</p>
								<p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
							</div>
							<span className="shrink-0 text-sm font-bold tabular-nums">
								{formatPKR(item.lineTotal)}
							</span>
						</div>
					))}

					<div className="mt-1 flex items-center justify-between border-t border-border pt-3">
						<span className="text-sm font-semibold">Total paid</span>
						<span className="text-base font-bold tabular-nums text-primary">
							{formatPKR(order.total)}
						</span>
					</div>
				</CardContent>
			</Card>

			{/* What's next */}
			<div className="flex flex-col gap-1 rounded-lg bg-muted/40 px-4 py-3 text-left">
				<p className="text-sm font-semibold">What happens next?</p>
				<p className="text-xs leading-relaxed text-muted-foreground">
					The seller will accept and ship your order. You&apos;ll receive notifications
					at each step. Your payment is held in escrow until you confirm receipt.
				</p>
			</div>

			{/* Actions */}
			<div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
				<Link
					href={`/buyer/orders/${orderId}`}
					className={cn(buttonVariants(), "w-full sm:w-auto")}
				>
					Track order
				</Link>
				<Link
					href="/browse"
					className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
				>
					Continue shopping
				</Link>
			</div>
		</div>
	);
}
