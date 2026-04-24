// ============================================================================
// Checkout Failed Page
// ============================================================================
//
// Payment failed landing page. Shown when a payment gateway redirect returns
// a failure. Provides a retry CTA that sends the user back to checkout.

import Link from "next/link";
import { XCircle } from "lucide-react";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Payment Failed — ShopSmart" };

export default function CheckoutFailedPage() {
	return (
		<div container-id="checkout-failed" className="mx-auto flex max-w-md flex-col gap-8 py-10 text-center">

			{/* Icon */}
			<div className="flex flex-col items-center gap-3">
				<div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
					<XCircle className="size-8 text-destructive" aria-hidden />
				</div>
				<h1 className="text-2xl font-bold tracking-tight">Payment failed</h1>
				<p className="text-muted-foreground">
					Your payment could not be processed. Your cart items are still saved.
				</p>
			</div>

			{/* Possible reasons */}
			<div className="flex flex-col gap-1 rounded-lg bg-muted/40 px-4 py-3 text-left">
				<p className="text-sm font-semibold">Common reasons</p>
				<ul className="mt-1 flex flex-col gap-1 text-xs leading-relaxed text-muted-foreground">
					<li>• Insufficient balance</li>
					<li>• Card declined by issuer</li>
					<li>• Session timeout — please try again</li>
					<li>• Network error during payment</li>
				</ul>
			</div>

			{/* Actions */}
			<div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
				<Link
					href="/checkout"
					className={cn(buttonVariants(), "w-full sm:w-auto")}
				>
					Try again
				</Link>
				<Link
					href="/cart"
					className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
				>
					Back to cart
				</Link>
			</div>

			<p className="text-xs text-muted-foreground">
				If the problem persists,{" "}
				<Link href="/support" className="underline underline-offset-2">
					contact support
				</Link>
				.
			</p>
		</div>
	);
}
