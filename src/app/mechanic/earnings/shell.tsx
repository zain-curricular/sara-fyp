// ============================================================================
// Mechanic Earnings Shell
// ============================================================================
//
// Fetches and displays mechanic payouts. Shows this-month and all-time totals
// plus a scrollable list of individual payouts.

"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp } from "lucide-react";

import { Badge } from "@/components/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { Skeleton } from "@/components/primitives/skeleton";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Payout = {
	id: string;
	amount: number;
	status: string;
	created_at: string;
	reference: string | null;
};

type EarningsData = {
	payouts: Payout[];
	totals: { allTime: number; thisMonth: number };
};

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function MechanicEarningsShell() {
	const [data, setData] = useState<EarningsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetch("/api/mechanic/earnings")
			.then((r) => r.json())
			.then((json) => {
				if (!json.ok) throw new Error(json.error ?? "Failed to load");
				setData(json.data as EarningsData);
			})
			.catch((err) => setError(err instanceof Error ? err.message : "Error"))
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-2 gap-3">
					<Skeleton className="h-24 rounded-xl" />
					<Skeleton className="h-24 rounded-xl" />
				</div>
				<Skeleton className="h-64 rounded-xl" />
			</div>
		);
	}

	if (error) {
		return (
			<p className="py-12 text-center text-sm text-destructive">{error}</p>
		);
	}

	return (
		<div container-id="mechanic-earnings" className="flex flex-col gap-6">

			<header className="flex flex-col gap-1">
				<h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
				<p className="text-sm text-muted-foreground">Your payout history from ShopSmart.</p>
			</header>

			{/* Totals */}
			<div container-id="mechanic-earnings-totals" className="grid grid-cols-2 gap-3">
				<Card size="sm">
					<CardContent className="flex flex-col gap-1 pt-4">
						<TrendingUp className="size-4 text-primary" aria-hidden />
						<p className="text-2xl font-bold tabular-nums">
							Rs {(data?.totals.thisMonth ?? 0).toLocaleString()}
						</p>
						<p className="text-xs text-muted-foreground">This month</p>
					</CardContent>
				</Card>

				<Card size="sm">
					<CardContent className="flex flex-col gap-1 pt-4">
						<DollarSign className="size-4 text-primary" aria-hidden />
						<p className="text-2xl font-bold tabular-nums">
							Rs {(data?.totals.allTime ?? 0).toLocaleString()}
						</p>
						<p className="text-xs text-muted-foreground">All time</p>
					</CardContent>
				</Card>
			</div>

			{/* Payouts list */}
			<Card size="sm">
				<CardHeader>
					<CardTitle className="text-base">Payout history</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-0">
					{(data?.payouts ?? []).length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							No payouts yet. Complete verifications to earn.
						</p>
					) : (
						(data?.payouts ?? []).map((payout, i) => (
							<div key={payout.id}>
								{i > 0 && <Separator />}
								<div className="flex items-center justify-between gap-4 py-3">
									<div className="flex flex-col gap-0.5">
										<p className="text-sm font-medium tabular-nums">
											Rs {(payout.amount ?? 0).toLocaleString()}
										</p>
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<span>{new Date(payout.created_at).toLocaleDateString()}</span>
											{payout.reference && (
												<>
													<span>·</span>
													<span className="font-mono">{payout.reference}</span>
												</>
											)}
										</div>
									</div>
									<Badge
										variant={payout.status === "paid" ? "default" : "secondary"}
										className="rounded-sm text-[10px]"
									>
										{payout.status?.toUpperCase() ?? "PENDING"}
									</Badge>
								</div>
							</div>
						))
					)}
				</CardContent>
			</Card>
		</div>
	);
}
