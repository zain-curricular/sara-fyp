// ============================================================================
// Seller Dashboard Shell
// ============================================================================
//
// Analytics-forward seller overview (Wireframe Variant A). All figures are
// static placeholders — no analytics API exists yet. The layout shows KPI
// cards, a weekly revenue bar chart, top-listings table, conversion funnel,
// and a "needs action" task list.
//
// When the analytics API ships, replace MOCK_* constants with real hook data.

"use client";

import Link from "next/link";
import {
	AlertCircle,
	ArrowUpRight,
	BarChart3,
	Clock,
	MessageSquare,
	Package,
	TrendingUp,
} from "lucide-react";

import { buttonVariants } from "@/components/primitives/button";
import { Badge } from "@/components/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";

// ----------------------------------------------------------------------------
// Placeholder data
// ----------------------------------------------------------------------------

const MOCK_STATS = [
	{ label: "Revenue", value: "$12,480", delta: "+18% vs last month", up: true },
	{ label: "Orders", value: "34", delta: "+4 vs last month", up: true },
	{ label: "Conversion", value: "3.4%", delta: "−0.2% vs last month", up: false },
	{ label: "Active listings", value: "48", delta: "4 auctions live", up: null },
] as const;

const MOCK_WEEKLY_REVENUE = [28, 36, 52, 48, 62, 71, 88];
const WEEKLY_LABELS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];

const MOCK_TOP_LISTINGS = [
	{ title: "iPhone 14 Pro", sold: 12, revenue: "$6,200" },
	{ title: "Galaxy S23 Ultra", sold: 8, revenue: "$3,100" },
	{ title: "Pixel 8", sold: 6, revenue: "$1,900" },
	{ title: "iPhone SE (3rd gen)", sold: 4, revenue: "$720" },
];

const MOCK_FUNNEL = [
	{ label: "Views", count: 4820, pct: 100 },
	{ label: "Favorited", count: 612, pct: 13 },
	{ label: "Add to watchlist", count: 388, pct: 8 },
	{ label: "Purchase", count: 164, pct: 3.4 },
];

const MOCK_ACTIONS = [
	{ icon: Package, label: "2 orders to ship today", href: "#", cta: "Print labels" },
	{ icon: MessageSquare, label: "4 unanswered messages", href: "#", cta: "Open chat" },
	{ icon: AlertCircle, label: "1 listing auto-delisted (photos)", href: "#", cta: "Fix now" },
	{ icon: Clock, label: "Auction ending in 42 min — 8 bids", href: "#", cta: "Watch" },
];

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

/** Single KPI card with delta line. */
function StatCard({
	label,
	value,
	delta,
	up,
}: {
	label: string;
	value: string;
	delta: string;
	up: boolean | null;
}) {
	return (
		<Card size="sm">
			<CardContent className="flex flex-col gap-1 pt-4">
				<p className="text-xs font-medium text-muted-foreground">{label}</p>
				<p className="text-2xl font-bold tabular-nums">{value}</p>
				<p
					className={
						up === true
							? "text-xs text-green-600 dark:text-green-400"
							: up === false
								? "text-xs text-destructive"
								: "text-xs text-muted-foreground"
					}
				>
					{up === true ? "▲ " : up === false ? "▼ " : ""}
					{delta}
				</p>
			</CardContent>
		</Card>
	);
}

/** CSS bar chart — no external chart library needed. */
function RevenueBarChart() {
	const max = Math.max(...MOCK_WEEKLY_REVENUE);
	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle className="text-base">Revenue by week</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				<div className="flex items-end gap-1.5" style={{ height: "90px" }}>
					{MOCK_WEEKLY_REVENUE.map((v, i) => {
						const isLast = i === MOCK_WEEKLY_REVENUE.length - 1;
						const heightPct = Math.round((v / max) * 100);
						return (
							<div
								key={i}
								className={`flex-1 rounded-t-sm ${isLast ? "bg-primary" : "bg-foreground/20"}`}
								style={{ height: `${heightPct}%` }}
								aria-label={`${WEEKLY_LABELS[i]}: $${v}k`}
							/>
						);
					})}
				</div>
				<div className="flex justify-between">
					{WEEKLY_LABELS.map((w) => (
						<span key={w} className="flex-1 text-center text-[10px] text-muted-foreground">
							{w}
						</span>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

/** Top-performing listings table. */
function TopListings() {
	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle className="text-base">Top listings</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-0">
				{MOCK_TOP_LISTINGS.map((row, i) => (
					<div key={row.title}>
						{i > 0 && <Separator />}
						<div className="flex items-center justify-between py-2.5">
							<div className="flex flex-col gap-0.5">
								<p className="text-sm font-medium">{row.title}</p>
								<p className="text-xs text-muted-foreground">{row.sold} sold</p>
							</div>
							<span className="text-sm font-bold tabular-nums text-primary">{row.revenue}</span>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}

/** Horizontal funnel bars. */
function ConversionFunnel() {
	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle className="text-base">Funnel · last 30 days</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{MOCK_FUNNEL.map((row, i) => (
					<div key={row.label} className="flex items-center gap-3">
						<span className="w-28 shrink-0 text-xs text-muted-foreground">{row.label}</span>
						<div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
							<div
								className={`h-full rounded-full ${i === MOCK_FUNNEL.length - 1 ? "bg-primary" : "bg-foreground/70"}`}
								style={{ width: `${row.pct}%` }}
							/>
						</div>
						<span className="w-10 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
							{row.count.toLocaleString()}
						</span>
					</div>
				))}
			</CardContent>
		</Card>
	);
}

/** Action items that need the seller's attention. */
function NeedsAction() {
	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle className="text-base">Needs action</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-0">
				{MOCK_ACTIONS.map((item, i) => (
					<div key={item.label}>
						{i > 0 && <Separator />}
						<div className="flex items-center gap-3 py-3">
							<item.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
							<p className="flex-1 text-sm">{item.label}</p>
							<Link
								href={item.href}
								className={buttonVariants({ variant: "outline", size: "sm" })}
							>
								{item.cta}
							</Link>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

/** Seller dashboard — analytics-forward overview. All data is placeholder. */
export default function SellerShell() {
	return (
		<div container-id="seller-shell" className="flex flex-col gap-6">

			{/* Header */}
			<header
				container-id="seller-header"
				className="flex flex-wrap items-start justify-between gap-3"
			>
				<div className="flex flex-col gap-1">
					<p className="text-xs font-medium text-muted-foreground">Apr 2026 · this month</p>
					<h1 className="text-3xl font-bold tracking-tight">Shop overview</h1>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="secondary" className="rounded-sm tabular-nums">last 30d</Badge>
					<Link href="/seller/listings/new" className={buttonVariants({ size: "sm" })}>
						<TrendingUp className="size-3.5" aria-hidden />
						New listing
					</Link>
				</div>
			</header>

			{/* KPI stats row */}
			<div
				container-id="seller-stats"
				className="grid grid-cols-2 gap-3 sm:grid-cols-4"
			>
				{MOCK_STATS.map((s) => (
					<StatCard key={s.label} {...s} />
				))}
			</div>

			{/* Revenue chart + Top listings */}
			<div
				container-id="seller-charts"
				className="grid grid-cols-1 gap-4 lg:grid-cols-2"
			>
				<RevenueBarChart />
				<TopListings />
			</div>

			{/* Funnel + Needs action */}
			<div
				container-id="seller-lower"
				className="grid grid-cols-1 gap-4 lg:grid-cols-2"
			>
				<ConversionFunnel />
				<NeedsAction />
			</div>

			{/* Quick links */}
			<div container-id="seller-quick-links" className="flex flex-wrap gap-2">
				<Link
					href="/seller/listings"
					className={buttonVariants({ variant: "outline", size: "sm" })}
				>
					<BarChart3 className="size-3.5" aria-hidden />
					My listings
				</Link>
				<Link
					href="/seller/listings/new"
					className={buttonVariants({ variant: "ghost", size: "sm" })}
				>
					<ArrowUpRight className="size-3.5" aria-hidden />
					New listing
				</Link>
			</div>
		</div>
	);
}
