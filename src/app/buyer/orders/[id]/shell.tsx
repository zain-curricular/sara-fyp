// ============================================================================
// Buyer Order Detail Shell
// ============================================================================
//
// Timeline-first order detail view. Shows a vertical event timeline with each
// step marked done/active/pending. Below: item + seller summary, escrow price
// breakdown, and action buttons. All data is placeholder — connect to orders
// API when ready.

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
	{ label: "Order placed", date: "Apr 19 · 14:02", detail: "You paid Rs 12,500 — held in escrow", state: "done" },
	{ label: "Seller shipped", date: "Apr 20 · 09:11", detail: "TCS 4412-8821-00", state: "done" },
	{ label: "Inspected at hub", date: "Apr 21 · 18:40", detail: "Mechanic inspection passed", state: "done" },
	{ label: "Arriving at your door", date: "Apr 24 · est.", detail: "Karachi, Gulshan", state: "active" },
	{ label: "You approve", date: "+14 days", detail: "Escrow releases to seller", state: "pending" },
	{ label: "Warranty active", date: "+3 months", detail: "Claim anytime from /warranty", state: "pending" },
];

// ----------------------------------------------------------------------------
// Timeline step
// ----------------------------------------------------------------------------

function TimelineStep({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
	const { label, date, detail, state } = step;

	return (
		<div className="flex gap-3">
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
					{state === "done" ? <CheckCircle2 className="size-3" aria-hidden /> : null}
				</div>
				{!isLast && (
					<div
						className={cn("mt-1 w-0.5 flex-1", state === "done" ? "bg-foreground/30" : "bg-border")}
						style={{ minHeight: "28px" }}
						aria-hidden
					/>
				)}
			</div>

			<div className={cn("flex flex-col gap-0.5 pb-5", isLast && "pb-0")}>
				<div className="flex flex-wrap items-baseline gap-2">
					<p className={cn("text-sm font-semibold", state === "pending" && "text-muted-foreground")}>
						{label}
					</p>
					<span className="text-xs text-muted-foreground">{date}</span>
				</div>
				<p className={cn("text-xs leading-relaxed", state === "pending" ? "text-muted-foreground/60" : "text-muted-foreground")}>
					{detail}
				</p>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function OrderDetailShell({ orderId }: OrderDetailShellProps) {
	return (
		<div container-id="order-detail-shell" className="flex flex-col gap-6">

			<Link
				href="/buyer/orders"
				className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit -ml-2")}
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				My orders
			</Link>

			<header container-id="order-detail-header" className="flex flex-col gap-1">
				<p className="text-xs text-muted-foreground">order #{orderId}</p>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<h1 className="text-2xl font-bold leading-snug tracking-tight">
						Alternator · Toyota Corolla 2019
					</h1>
					<span className="text-xl font-bold tabular-nums text-primary">Rs 12,500</span>
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
							{MOCK_TIMELINE.map((step, i) => (
								<TimelineStep
									key={step.label}
									step={step}
									isLast={i === MOCK_TIMELINE.length - 1}
								/>
							))}
						</CardContent>
					</Card>

					{/* Item + seller */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Item & seller</CardTitle>
						</CardHeader>
						<CardContent className="flex gap-4">
							<div className="aspect-square w-20 shrink-0 rounded-md bg-muted/40" />
							<div className="flex flex-col gap-1">
								<p className="text-sm font-semibold">Alternator · Toyota Corolla 2019 · OEM</p>
								<p className="text-xs text-muted-foreground">Grade A · mechanic inspected · from @zain_parts</p>
								<p className="text-xs text-muted-foreground">Lahore → Karachi</p>
								<p className="text-xs text-muted-foreground">
									Tracking: <span className="font-mono">TCS 4412-8821-00</span>
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									Warranty: 3 months from delivery
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="flex flex-col gap-4 lg:sticky lg:top-20">

					{/* Payment summary */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Payment summary</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-0">
							<div className="flex items-center justify-between py-2 text-sm">
								<span className="text-muted-foreground">Item price</span>
								<span className="tabular-nums">Rs 11,800</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between py-2 text-sm">
								<span className="text-muted-foreground">Shipping</span>
								<span className="tabular-nums">Rs 700</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between py-2 text-sm">
								<span className="text-muted-foreground">Marketplace fee</span>
								<span className="tabular-nums text-muted-foreground">Rs 0</span>
							</div>
							<Separator />
							<div className="flex items-center justify-between py-2.5">
								<span className="text-sm font-semibold">Total held in escrow</span>
								<span className="text-base font-bold tabular-nums text-primary">Rs 12,500</span>
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
