// ============================================================================
// Buyer Order Detail Shell
// ============================================================================
//
// Timeline-first order detail view (Wireframe Variant B). Shows a vertical
// event timeline (Ordered → Escrowed → Shipped → Inspected → Arriving →
// Approve → Warranty) with each step marked done/active/pending.
//
// Below the timeline: item + seller summary card, escrow price breakdown,
// and action buttons (Chat / Dispute / Approve & release). All data is
// placeholder — connect to the orders API when it ships.

"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/primitives/button";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type OrderDetailShellProps = {
	orderId: string;
};

type TimelineStepState = "done" | "active" | "pending";

type TimelineStep = {
	label: string;
	date: string;
	detail: string;
	state: TimelineStepState;
};

// ----------------------------------------------------------------------------
// Placeholder data
// ----------------------------------------------------------------------------

const MOCK_TIMELINE: TimelineStep[] = [
	{ label: "Order placed", date: "Apr 19 · 14:02", detail: "You paid $501 — held in escrow", state: "done" },
	{ label: "Seller shipped", date: "Apr 20 · 09:11", detail: "DHL 4412-8821-00", state: "done" },
	{ label: "Inspected at hub", date: "Apr 21 · 18:40", detail: "18-point check passed", state: "done" },
	{ label: "Arriving at your door", date: "Apr 24 · est.", detail: "Hamburg, 21073", state: "active" },
	{ label: "You approve", date: "+14 days", detail: "Escrow releases to seller", state: "pending" },
	{ label: "Warranty active", date: "+6 months", detail: "Claim anytime from /warranty", state: "pending" },
];

// ----------------------------------------------------------------------------
// Timeline step
// ----------------------------------------------------------------------------

function TimelineStep({
	step,
	isLast,
}: {
	step: TimelineStep;
	isLast: boolean;
}) {
	const { label, date, detail, state } = step;

	return (
		<div className="flex gap-3">
			{/* Dot + connector line */}
			<div className="flex flex-col items-center">
				<div
					className={cn(
						"flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
						state === "done" && "border-foreground bg-foreground text-background",
						state === "active" && "border-primary bg-primary text-primary-foreground",
						state === "pending" && "border-border bg-background text-muted-foreground",
					)}
					aria-label={`Step ${label}: ${state}`}
				>
					{state === "done" ? (
						<CheckCircle2 className="size-3" aria-hidden />
					) : null}
				</div>
				{!isLast && (
					<div
						className={cn(
							"mt-1 w-0.5 flex-1",
							state === "done" ? "bg-foreground/30" : "bg-border",
						)}
						style={{ minHeight: "28px" }}
						aria-hidden
					/>
				)}
			</div>

			{/* Content */}
			<div className={cn("flex flex-col gap-0.5 pb-5", isLast && "pb-0")}>
				<div className="flex flex-wrap items-baseline gap-2">
					<p
						className={cn(
							"text-sm font-semibold",
							state === "pending" && "text-muted-foreground",
						)}
					>
						{label}
					</p>
					<span className="text-xs text-muted-foreground">{date}</span>
				</div>
				<p
					className={cn(
						"text-xs leading-relaxed",
						state === "pending" ? "text-muted-foreground/60" : "text-muted-foreground",
					)}
				>
					{detail}
				</p>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

/** Order detail with vertical timeline, escrow breakdown, and actions. */
export default function OrderDetailShell({ orderId }: OrderDetailShellProps) {
	return (
		<div container-id="order-detail-shell" className="flex flex-col gap-6">

			{/* Back link */}
			<Link
				href="/buyer/orders"
				className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit -ml-2")}
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				My orders
			</Link>

			{/* Header */}
			<header container-id="order-detail-header" className="flex flex-col gap-1">
				<p className="text-xs text-muted-foreground">order #{orderId}</p>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<h1 className="text-2xl font-bold tracking-tight leading-snug">
						iPhone 13 Pro · Graphite
					</h1>
					<span className="text-xl font-bold tabular-nums text-primary">$501.00</span>
				</div>
			</header>

			{/* Two-column on desktop */}
			<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">

				{/* Left — timeline + item card */}
				<div className="flex flex-col gap-5">

					{/* Timeline */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Order timeline</CardTitle>
						</CardHeader>
						<CardContent>
							{MOCK_TIMELINE.map((step, i) => (
								<TimelineStep
									key={step.label}
									step={step}
									isLast={i === MOCK_TIMELINE.length - 1}
								/>
							))}
						</CardContent>
					</Card>

					{/* Item + seller summary */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Item & seller</CardTitle>
						</CardHeader>
						<CardContent className="flex gap-4">
							<div className="aspect-square w-20 shrink-0 rounded-md bg-muted/40" />
							<div className="flex flex-col gap-1">
								<p className="text-sm font-semibold">iPhone 13 Pro · 256 GB · Graphite</p>
								<p className="text-xs text-muted-foreground">Grade A · tested · from @julia_k</p>
								<p className="text-xs text-muted-foreground">Berlin → Hamburg</p>
								<p className="text-xs text-muted-foreground">
									Tracking: <span className="font-mono">DHL 4412-8821-00</span>
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									Warranty: 6 months from delivery
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right — price breakdown + escrow badge + actions */}
				<div className="flex flex-col gap-4 lg:sticky lg:top-20">

					{/* Escrow breakdown */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Payment summary</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-0">
							<div className="flex items-center justify-between py-2 text-sm">
								<span className="text-muted-foreground">Item price</span>
								<span className="tabular-nums">$489.00</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between py-2 text-sm">
								<span className="text-muted-foreground">Shipping</span>
								<span className="tabular-nums">$12.00</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between py-2 text-sm">
								<span className="text-muted-foreground">Marketplace fee</span>
								<span className="tabular-nums text-muted-foreground">$0.00</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between py-2.5">
								<span className="text-sm font-semibold">Total held in escrow</span>
								<span className="text-base font-bold tabular-nums text-primary">$501.00</span>
							</div>
						</CardContent>
					</Card>

					{/* Escrow trust card */}
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
						<Button type="button" className="w-full" disabled>
							✓ Approve & release payment
						</Button>
						<div className="grid grid-cols-2 gap-2">
							<Button type="button" variant="outline" className="w-full" disabled>
								Chat seller
							</Button>
							<Button type="button" variant="outline" className="w-full" disabled>
								Open dispute
							</Button>
						</div>
						<Link
							href={`/buyer/orders/${orderId}/review`}
							className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full")}
						>
							Leave a review
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
