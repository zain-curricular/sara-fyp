// ============================================================================
// Confirm Receipt Shell — Client Component
// ============================================================================
//
// Displays order summary and a prominent "Confirm I received this order"
// button. Warns the buyer that confirming releases funds from escrow.
// Calls POST /api/orders/[id]/confirm-receipt on submit. Redirects to the
// order detail page with a success toast on completion.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, PackageCheck } from "lucide-react";
import { toast } from "sonner";

import type { OrderStatus } from "@/lib/features/orders";
import { useAuthenticatedFetch } from "@/lib/hooks/useAuthenticatedFetch";
import { formatPKR } from "@/lib/utils/currency";

import { Button } from "@/components/primitives/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/primitives/card";

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

type Props = {
	orderId: string;
	orderNumber: string;
	total: number;
	itemCount: number;
	status: OrderStatus;
};

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function ConfirmReceiptShell({
	orderId,
	orderNumber,
	total,
	itemCount,
	status,
}: Props) {
	const router = useRouter();
	const authFetch = useAuthenticatedFetch();
	const [confirming, setConfirming] = useState(false);

	// If order isn't delivered, show a notice instead of the confirm button
	if (status !== "delivered") {
		return (
			<div
				container-id="confirm-receipt-unavailable"
				className="mx-auto flex max-w-lg flex-col gap-4 rounded-2xl border border-border bg-card p-8 shadow-sm"
			>
				<h1 className="text-xl font-semibold">Cannot confirm yet</h1>
				<p className="text-sm text-muted-foreground">
					Confirmation is only available once your order is marked as
					delivered.
				</p>
				<Button
					variant="outline"
					className="w-fit"
					onClick={() => router.push(`/buyer/orders/${orderId}`)}
				>
					Back to order
				</Button>
			</div>
		);
	}

	async function handleConfirm() {
		setConfirming(true);
		try {
			const res = await authFetch<{ ok: true } | { ok: false; error: string }>(
				`/api/orders/${encodeURIComponent(orderId)}/confirm-receipt`,
				{ method: "POST" },
			);

			if (!res.ok) {
				throw new Error("error" in res ? res.error : "Failed to confirm");
			}

			toast.success("Receipt confirmed — funds have been released to the seller");
			router.push(`/buyer/orders/${orderId}`);
			router.refresh();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to confirm receipt");
		} finally {
			setConfirming(false);
		}
	}

	return (
		<div
			container-id="confirm-receipt-shell"
			className="mx-auto flex max-w-lg flex-col gap-6"
		>
			<header className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<PackageCheck className="size-6 text-muted-foreground" />
					<h1 className="text-2xl font-semibold tracking-tight">
						Confirm receipt
					</h1>
				</div>
				<p className="text-sm text-muted-foreground">
					Confirm that you have received your order in good condition.
				</p>
			</header>

			{/* Order summary */}
			<Card size="sm">
				<CardHeader>
					<CardTitle>Order {orderNumber}</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-1 text-sm">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Items</span>
						<span>{itemCount}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Total</span>
						<span className="font-semibold">{formatPKR(total)}</span>
					</div>
				</CardContent>
			</Card>

			{/* Warning */}
			<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/20">
				<AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
				<p className="text-sm text-amber-800 dark:text-amber-300">
					By confirming receipt, you release the payment from escrow to the
					seller. This action cannot be undone. Only confirm if you have
					physically received and inspected your order.
				</p>
			</div>

			{/* Actions */}
			<div className="flex gap-2">
				<Button
					onClick={handleConfirm}
					disabled={confirming}
					className="flex-1"
				>
					{confirming
						? "Confirming…"
						: "Confirm I received this order"}
				</Button>
				<Button
					variant="outline"
					onClick={() => router.push(`/buyer/orders/${orderId}`)}
					disabled={confirming}
				>
					Cancel
				</Button>
			</div>
		</div>
	);
}
