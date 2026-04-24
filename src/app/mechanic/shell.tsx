// ============================================================================
// Mechanic Dashboard Shell
// ============================================================================
//
// Client shell for the mechanic overview page. Shows KPI row, quick links,
// and recent assigned requests.

"use client";

import Link from "next/link";
import { CheckCircle2, Clock, DollarSign, Wrench } from "lucide-react";

import type { MechanicProfile, MechanicVerificationRequest } from "@/lib/features/mechanic";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type MechanicDashboardShellProps = {
	profile: MechanicProfile | null;
	pendingCount: number;
	assignedRequests: MechanicVerificationRequest[];
	completedCount: number;
};

// ----------------------------------------------------------------------------
// KPI card
// ----------------------------------------------------------------------------

function KpiCard({
	icon: Icon,
	label,
	value,
	href,
}: {
	icon: React.ElementType;
	label: string;
	value: string | number;
	href: string;
}) {
	return (
		<Link href={href}>
			<Card size="sm" className="transition-shadow hover:shadow-md">
				<CardContent className="flex flex-col gap-1 pt-4">
					<Icon className="size-4 text-primary" aria-hidden />
					<p className="text-2xl font-bold tabular-nums">{value}</p>
					<p className="text-xs text-muted-foreground">{label}</p>
				</CardContent>
			</Card>
		</Link>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function MechanicDashboardShell({
	profile,
	pendingCount,
	assignedRequests,
	completedCount,
}: MechanicDashboardShellProps) {
	return (
		<div container-id="mechanic-dashboard" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="mechanic-dashboard-header" className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<p className="text-xs text-muted-foreground">Mechanic panel</p>
					<h1 className="text-3xl font-bold tracking-tight">
						{profile?.profile.fullName ? `Welcome, ${profile.profile.fullName.split(" ")[0]}` : "Dashboard"}
					</h1>
					{profile?.serviceAreas && profile.serviceAreas.length > 0 && (
						<p className="text-sm text-muted-foreground">
							Serving: {profile.serviceAreas.slice(0, 3).join(", ")}
						</p>
					)}
				</div>

				<Link href="/mechanic/requests">
					<Button size="sm">
						<Wrench className="size-3.5" aria-hidden />
						Browse requests
					</Button>
				</Link>
			</header>

			{/* KPI row */}
			<div container-id="mechanic-kpi-row" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<KpiCard icon={Clock} label="Pending in area" value={pendingCount} href="/mechanic/requests" />
				<KpiCard icon={Wrench} label="Assigned to me" value={assignedRequests.length} href="/mechanic/requests" />
				<KpiCard icon={CheckCircle2} label="Completed" value={completedCount} href="/mechanic/completed" />
				<KpiCard icon={DollarSign} label="Earnings" value="View" href="/mechanic/earnings" />
			</div>

			{/* Assigned requests */}
			<Card size="sm">
				<CardHeader>
					<CardTitle className="text-base">Assigned to me</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-0">
					{assignedRequests.length === 0 ? (
						<p className="py-4 text-center text-sm text-muted-foreground">
							No requests currently assigned. Browse the pool to accept one.
						</p>
					) : (
						assignedRequests.map((req, i) => (
							<div key={req.id}>
								{i > 0 && <Separator />}
								<div className="flex items-center justify-between gap-4 py-3">
									<div className="flex min-w-0 flex-col gap-0.5">
										<p className="truncate text-sm font-medium">
											{req.listing?.title ?? "Part verification request"}
										</p>
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											{req.listing?.city && <span>{req.listing.city}</span>}
											<span>·</span>
											<span>{new Date(req.createdAt).toLocaleDateString()}</span>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant="secondary" className="shrink-0 rounded-sm text-[10px]">
											ASSIGNED
										</Badge>
										<Link href={`/mechanic/requests/${req.id}`}>
											<Button size="sm" variant="outline">
												View
											</Button>
										</Link>
									</div>
								</div>
							</div>
						))
					)}
				</CardContent>
			</Card>

			{/* Quick links */}
			<div container-id="mechanic-quick-links" className="flex flex-wrap gap-2">
				<Link href="/mechanic/requests">
					<Button variant="outline" size="sm">Browse request pool</Button>
				</Link>
				<Link href="/mechanic/completed">
					<Button variant="ghost" size="sm">View completed</Button>
				</Link>
				<Link href="/mechanic/settings">
					<Button variant="ghost" size="sm">Update settings</Button>
				</Link>
			</div>
		</div>
	);
}
