// ============================================================================
// Admin Dashboard Shell
// ============================================================================
//
// KPI grid, realtime badge on disputes + fraud, quick action links, and
// a recent activity log. Subscribes to Supabase realtime on disputes and
// fraud_signals channels to show live counters.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
	Activity,
	AlertTriangle,
	ArrowRight,
	BarChart3,
	CircleDollarSign,
	Gavel,
	Package,
	Shield,
	ShoppingCart,
	Users,
} from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatPKRCompact } from "@/lib/utils/currency";
import type { AdminAction, AdminKPIs } from "@/lib/features/admin";

import { Badge } from "@/components/primitives/badge";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

// ----------------------------------------------------------------------------
// KPI card
// ----------------------------------------------------------------------------

function KpiCard({
	label,
	value,
	icon: Icon,
	realtime,
}: {
	label: string;
	value: string | number;
	icon: React.ElementType;
	realtime?: boolean;
}) {
	return (
		<Card size="sm">
			<CardHeader>
				<span className="text-xs font-medium text-muted-foreground">{label}</span>
				<div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
					<Icon className="size-4 text-muted-foreground" aria-hidden />
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-1">
				<p className="text-2xl font-bold tabular-nums">{value}</p>
				{realtime && (
					<div className="flex items-center gap-1.5">
						<span className="size-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden />
						<span className="text-xs text-muted-foreground">Live</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// ----------------------------------------------------------------------------
// Action row
// ----------------------------------------------------------------------------

function ActionRow({ action }: { action: AdminAction }) {
	const relTime = new Date(action.createdAt).toLocaleString("en-PK", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

	return (
		<div className="flex flex-col gap-0.5 py-2.5">
			<div className="flex items-center justify-between gap-2">
				<span className="text-sm font-medium capitalize">
					{action.action.replace(/_/g, " ")}
				</span>
				<span className="text-xs text-muted-foreground tabular-nums">{relTime}</span>
			</div>
			<div className="flex items-center gap-1.5">
				<Badge variant="outline" className="text-[10px]">
					{action.targetType}
				</Badge>
				{action.note && (
					<span className="truncate text-xs text-muted-foreground">{action.note}</span>
				)}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

type Props = {
	kpis: AdminKPIs;
	recentActions: AdminAction[];
};

export default function AdminDashboardShell({ kpis, recentActions }: Props) {
	// Realtime counters — start with server-fetched values
	const [openDisputes, setOpenDisputes] = useState(kpis.openDisputes);
	const [openFraud, setOpenFraud] = useState(kpis.openFraudSignals);

	// Subscribe to realtime channels
	useEffect(() => {
		const supabase = createBrowserSupabaseClient();

		const disputeChannel = supabase
			.channel("admin-disputes-rt")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "disputes" },
				() => {
					// Refetch count on any change
					supabase
						.from("disputes")
						.select("id", { count: "exact", head: true })
						.in("status", ["open", "under_review"])
						.then(({ count }: { count: number | null }) => {
							if (count !== null) setOpenDisputes(count);
						});
				},
			)
			.subscribe();

		const fraudChannel = supabase
			.channel("admin-fraud-rt")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "fraud_signals" },
				() => {
					supabase
						.from("fraud_signals")
						.select("id", { count: "exact", head: true })
						.eq("status", "open")
						.then(({ count }: { count: number | null }) => {
							if (count !== null) setOpenFraud(count);
						});
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(disputeChannel);
			void supabase.removeChannel(fraudChannel);
		};
	}, []);

	const kpiConfig = [
		{ label: "Total Users", value: kpis.totalUsers.toLocaleString(), icon: Users },
		{ label: "Total Sellers", value: kpis.totalSellers.toLocaleString(), icon: ShoppingCart },
		{ label: "Active Listings", value: kpis.activeListings.toLocaleString(), icon: Package },
		{ label: "Orders Today", value: kpis.ordersToday.toLocaleString(), icon: BarChart3 },
		{
			label: "GMV Today",
			value: formatPKRCompact(kpis.gmvToday),
			icon: CircleDollarSign,
		},
		{
			label: "Open Disputes",
			value: openDisputes,
			icon: Gavel,
			realtime: true,
		},
		{
			label: "Fraud Signals",
			value: openFraud,
			icon: AlertTriangle,
			realtime: true,
		},
		{
			label: "Pending Verifications",
			value: kpis.pendingMechanicVerifications,
			icon: Shield,
		},
	];

	return (
		<div container-id="admin-dashboard" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="admin-dashboard-header" className="flex flex-col gap-1">
				<p className="text-xs font-medium text-muted-foreground">
					{new Date().toLocaleDateString("en-PK", {
						weekday: "long",
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
				</p>
				<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
			</header>

			{/* KPI grid */}
			<div
				container-id="admin-kpi-grid"
				className="grid grid-cols-2 gap-4 sm:grid-cols-4"
			>
				{kpiConfig.map((kpi) => (
					<KpiCard key={kpi.label} {...kpi} />
				))}
			</div>

			{/* Quick actions */}
			<Card size="sm">
				<CardHeader>
					<CardTitle>Quick Actions</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-2">
					<Link
						href="/admin/listings?status=pending_review"
						className={buttonVariants({ variant: "outline", size: "sm" })}
					>
						<Package className="size-3.5" aria-hidden />
						Review listings
						<ArrowRight className="size-3.5" aria-hidden />
					</Link>
					<Link
						href="/admin/disputes"
						className={buttonVariants({ variant: "outline", size: "sm" })}
					>
						<Gavel className="size-3.5" aria-hidden />
						Handle disputes
						<ArrowRight className="size-3.5" aria-hidden />
					</Link>
					<Link
						href="/admin/fraud"
						className={buttonVariants({ variant: "outline", size: "sm" })}
					>
						<AlertTriangle className="size-3.5" aria-hidden />
						Fraud signals
						<ArrowRight className="size-3.5" aria-hidden />
					</Link>
					<Link
						href="/admin/users"
						className={buttonVariants({ variant: "outline", size: "sm" })}
					>
						<Users className="size-3.5" aria-hidden />
						Manage users
						<ArrowRight className="size-3.5" aria-hidden />
					</Link>
				</CardContent>
			</Card>

			{/* Activity log */}
			<Card size="sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Activity className="size-4" aria-hidden />
						Recent activity
					</CardTitle>
				</CardHeader>
				<CardContent>
					{recentActions.length === 0 ? (
						<p className="py-4 text-center text-sm text-muted-foreground">No recent activity.</p>
					) : (
						<div className="flex flex-col divide-y divide-border">
							{recentActions.map((action) => (
								<ActionRow key={action.id} action={action} />
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
