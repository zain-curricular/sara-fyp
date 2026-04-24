// ============================================================================
// Seller Analytics Shell
// ============================================================================
//
// Client shell rendering KPI cards, revenue area chart (Recharts), top-5
// listings bar chart, and order-status pie chart.
// Data is seeded from SSR props and optionally refreshed via GET /api/seller/analytics.

"use client";

import { useEffect, useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Loader2, TrendingUp } from "lucide-react";

import type { AnalyticsPayload } from "@/lib/features/seller-store";
import { formatPKR } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
	completed: "#22c55e",
	delivered: "#3b82f6",
	shipped: "#f59e0b",
	accepted: "#a78bfa",
	paid_escrow: "#06b6d4",
	pending_payment: "#94a3b8",
	cancelled: "#ef4444",
	refunded: "#f43f5e",
	disputed: "#f97316",
};

const PIE_FALLBACK = "#8b5cf6";

function statusColor(s: string): string {
	return STATUS_COLORS[s] ?? PIE_FALLBACK;
}

// ----------------------------------------------------------------------------
// KPI Card
// ----------------------------------------------------------------------------

function KpiCard({
	label,
	value,
	sub,
}: {
	label: string;
	value: string;
	sub?: string;
}) {
	return (
		<Card size="sm">
			<CardContent className="flex flex-col gap-1 pt-4">
				<p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
				<p className="text-2xl font-bold tabular-nums">{value}</p>
				{sub && <p className="text-xs text-muted-foreground">{sub}</p>}
			</CardContent>
		</Card>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

type AnalyticsShellProps = {
	initialData: AnalyticsPayload | null;
};

export default function AnalyticsShell({ initialData }: AnalyticsShellProps) {
	const [data, setData] = useState<AnalyticsPayload | null>(initialData);
	const [loading, setLoading] = useState(!initialData);

	// Refresh from client if SSR returned null
	useEffect(() => {
		if (data) return;

		void (async () => {
			setLoading(true);
			try {
				const res = await fetch("/api/seller/analytics");
				const json = (await res.json()) as { ok: boolean; data?: AnalyticsPayload };
				if (json.ok && json.data) setData(json.data);
			} catch {
				// leave empty
			} finally {
				setLoading(false);
			}
		})();
	}, [data]);

	if (loading) {
		return (
			<div container-id="analytics-loading" className="flex flex-col gap-6">
				<Skeleton className="h-10 w-40" />
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-24 rounded-xl" />
					))}
				</div>
				<Skeleton className="h-64 w-full rounded-xl" />
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<Skeleton className="h-64 rounded-xl" />
					<Skeleton className="h-64 rounded-xl" />
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div container-id="analytics-empty" className="flex flex-col items-center gap-3 py-16 text-center">
				<TrendingUp className="size-10 text-muted-foreground/40" aria-hidden />
				<p className="text-sm text-muted-foreground">No analytics data yet. Start making sales!</p>
			</div>
		);
	}

	const { kpis, revenueByDay, topListings, ordersByStatus } = data;

	// Short date labels for x-axis
	const revenueChartData = revenueByDay.map((d) => ({
		...d,
		label: d.date.slice(5), // "MM-DD"
	}));

	return (
		<div container-id="analytics-shell" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="analytics-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
				<p className="text-sm text-muted-foreground">Last 30 days performance</p>
			</header>

			{/* KPI cards */}
			<div container-id="analytics-kpis" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<KpiCard label="Total Revenue" value={formatPKR(kpis.totalRevenue)} />
				<KpiCard label="Total Orders" value={kpis.totalOrders.toLocaleString()} />
				<KpiCard
					label="Avg Order Value"
					value={formatPKR(kpis.avgOrderValue)}
				/>
				<KpiCard label="Active Listings" value={kpis.activeListings.toLocaleString()} />
			</div>

			{/* Revenue area chart */}
			<Card size="sm">
				<CardHeader>
					<CardTitle className="text-base">Revenue — last 30 days</CardTitle>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={220}>
						<AreaChart data={revenueChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
							<defs>
								<linearGradient id="rev-gradient" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
									<stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
							<XAxis
								dataKey="label"
								tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
								tickLine={false}
								interval={4}
							/>
							<YAxis
								tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
								tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
								tickLine={false}
								axisLine={false}
								width={40}
							/>
							<Tooltip
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								formatter={(v: any) => [formatPKR(v as number), "Revenue"]}
								labelStyle={{ fontSize: 11 }}
								contentStyle={{
									background: "hsl(var(--card))",
									border: "1px solid hsl(var(--border))",
									borderRadius: 8,
									fontSize: 12,
								}}
							/>
							<Area
								type="monotone"
								dataKey="revenue"
								stroke="hsl(var(--primary))"
								strokeWidth={2}
								fill="url(#rev-gradient)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			{/* Bottom row: top listings + orders by status */}
			<div container-id="analytics-charts-row" className="grid grid-cols-1 gap-4 lg:grid-cols-2">

				{/* Top listings bar chart */}
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-base">Top 5 listings by revenue</CardTitle>
					</CardHeader>
					<CardContent>
						{topListings.length === 0 ? (
							<p className="text-sm text-muted-foreground">No sales yet.</p>
						) : (
							<ResponsiveContainer width="100%" height={200}>
								<BarChart
									data={topListings}
									layout="vertical"
									margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
								>
									<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
									<XAxis
										type="number"
										tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
										tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
										tickLine={false}
										axisLine={false}
									/>
									<YAxis
										type="category"
										dataKey="title"
										width={120}
										tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
										tickLine={false}
										tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 18)}…` : v)}
									/>
									<Tooltip
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										formatter={(v: any) => [formatPKR(v as number), "Revenue"]}
										contentStyle={{
											background: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: 8,
											fontSize: 12,
										}}
									/>
									<Bar dataKey="revenue" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
								</BarChart>
							</ResponsiveContainer>
						)}
					</CardContent>
				</Card>

				{/* Orders by status pie chart */}
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-base">Orders by status</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center gap-6">
						{ordersByStatus.length === 0 ? (
							<p className="text-sm text-muted-foreground">No orders yet.</p>
						) : (
							<>
								<ResponsiveContainer width={160} height={160}>
									<PieChart>
										<Pie
											data={ordersByStatus}
											cx="50%"
											cy="50%"
											innerRadius={40}
											outerRadius={70}
											paddingAngle={2}
											dataKey="count"
										>
											{ordersByStatus.map((entry, i) => (
												<Cell key={i} fill={statusColor(entry.status)} />
											))}
										</Pie>
										<Tooltip
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											formatter={(v: any, _n: any, p: any) => [
												v as number,
												(p?.payload?.status as string) ?? "",
											]}
											contentStyle={{
												background: "hsl(var(--card))",
												border: "1px solid hsl(var(--border))",
												borderRadius: 8,
												fontSize: 12,
											}}
										/>
									</PieChart>
								</ResponsiveContainer>

								{/* Legend */}
								<div className="flex flex-col gap-1.5">
									{ordersByStatus.map((entry) => (
										<div key={entry.status} className="flex items-center gap-2 text-xs">
											<span
												className="size-2.5 shrink-0 rounded-full"
												style={{ background: statusColor(entry.status) }}
											/>
											<span className="text-muted-foreground capitalize">
												{entry.status.replace(/_/g, " ")}
											</span>
											<span className="ml-auto font-medium tabular-nums">{entry.count}</span>
										</div>
									))}
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
