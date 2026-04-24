// ============================================================================
// Seller Payouts Shell
// ============================================================================
//
// Displays a list of payout periods with amount, status, and method.
// Empty state prompts seller to set up a payout method.

"use client";

import Link from "next/link";
import { Banknote, Settings } from "lucide-react";

import type { PayoutRecord } from "./page";
import { formatPKR } from "@/lib/utils/currency";
import { Badge } from "@/components/primitives/badge";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Status badge config
// ----------------------------------------------------------------------------

const STATUS_META: Record<
	PayoutRecord["status"],
	{ label: string; variant: "default" | "secondary" | "outline" }
> = {
	pending: { label: "Pending", variant: "secondary" },
	processing: { label: "Processing", variant: "outline" },
	paid: { label: "Paid", variant: "default" },
	failed: { label: "Failed", variant: "outline" },
};

function formatDateRange(start: string, end: string): string {
	const fmt = (d: string) =>
		new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
	return `${fmt(start)} – ${fmt(end)}`;
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function PayoutsShell({ payouts }: { payouts: PayoutRecord[] }) {
	return (
		<div container-id="payouts-shell" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="payouts-header" className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<Banknote className="size-5 text-muted-foreground" aria-hidden />
						<h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
					</div>
					<p className="text-sm text-muted-foreground">Your earnings, transferred to your account</p>
				</div>
				<Link
					href="/seller/payouts/setup"
					className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
				>
					<Settings className="size-3.5" aria-hidden />
					Payout settings
				</Link>
			</header>

			{payouts.length === 0 ? (
				<div
					container-id="payouts-empty"
					className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center"
				>
					<Banknote className="size-10 text-muted-foreground/30" aria-hidden />
					<div className="flex flex-col gap-1">
						<p className="text-sm font-medium">No payouts yet</p>
						<p className="text-xs text-muted-foreground">
							Complete orders to start earning. Payouts are processed weekly.
						</p>
					</div>
					<Link href="/seller/payouts/setup" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
						Setup payout method
					</Link>
				</div>
			) : (
				<Card size="sm">
					<CardContent className="flex flex-col gap-0 p-0">
						{payouts.map((payout, i) => {
							const meta = STATUS_META[payout.status];
							return (
								<div key={payout.id}>
									{i > 0 && <Separator />}
									<div className="flex items-center gap-3 px-4 py-3">
										<div className="flex flex-1 flex-col gap-0.5">
											<p className="text-sm font-medium">
												{formatDateRange(payout.periodStart, payout.periodEnd)}
											</p>
											{payout.method && (
												<p className="text-xs capitalize text-muted-foreground">
													{payout.method.replace(/_/g, " ")}
												</p>
											)}
										</div>
										<div className="flex items-center gap-3">
											<Badge variant={meta.variant} className="rounded-sm text-[10px]">
												{meta.label}
											</Badge>
											<span className="text-sm font-bold tabular-nums text-primary">
												{formatPKR(payout.amount)}
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
