// ============================================================================
// Seller Orders Error Boundary
// ============================================================================

"use client";

import { useEffect } from "react";
import { Button } from "@/components/primitives/button";

type ErrorProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function SellerOrdersError({ error, reset }: ErrorProps) {
	useEffect(() => {
		console.error("[SellerOrders]", error);
	}, [error]);

	return (
		<div container-id="seller-orders-error" className="flex flex-col items-center justify-center gap-4 py-20 text-center">
			<h2 className="text-xl font-bold">Failed to load orders</h2>
			<p className="text-sm text-muted-foreground">
				Something went wrong fetching your orders. Please try again.
			</p>
			<Button type="button" variant="outline" onClick={reset}>
				Try again
			</Button>
		</div>
	);
}
