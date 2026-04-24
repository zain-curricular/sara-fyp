// ============================================================================
// Admin Payouts Shell
// ============================================================================
//
// Table of payout records with "Run Payout Batch" button.
// Run batch: POST /api/admin/payouts

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Play } from "lucide-react";
import { toast } from "sonner";

import type { AdminPayout } from "@/lib/features/admin";
import { formatPKR } from "@/lib/utils/currency";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Props = {
	payouts: AdminPayout[];
};

// ----------------------------------------------------------------------------
// Status badge
// ----------------------------------------------------------------------------

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
	if (s === "paid") return "default";
	if (s === "failed") return "destructive";
	if (s === "processing") return "secondary";
	return "outline";
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminPayoutsShell({ payouts }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const pendingCount = payouts.filter((p) => p.status === "pending").length;

	async function runBatch() {
		if (!window.confirm(`Run payout batch? This will process ${pendingCount} pending payout(s).`)) {
			return;
		}
		setLoading(true);
		try {
			const res = await fetch("/api/admin/payouts", { method: "POST" });
			const json = await res.json() as { ok: boolean; data?: { count: number }; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success(`Payout batch run: ${json.data?.count ?? 0} processed`);
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div container-id="admin-payouts" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="admin-payouts-header" className="flex items-start justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
					<p className="text-sm text-muted-foreground">
						{payouts.length} payout(s) · {pendingCount} pending
					</p>
				</div>
				<Button
					variant="default"
					size="sm"
					onClick={runBatch}
					disabled={loading || pendingCount === 0}
				>
					<Play className="size-3.5" aria-hidden />
					Run payout batch
				</Button>
			</header>

			{/* Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="size-4" aria-hidden />
						Payout records
					</CardTitle>
				</CardHeader>
				<CardContent>
					{payouts.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">No payouts found.</p>
					) : (
						<div container-id="admin-payouts-table" className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border text-left text-xs text-muted-foreground">
										<th className="pb-2 pr-4 font-medium">Seller</th>
										<th className="pb-2 pr-4 font-medium">Amount</th>
										<th className="pb-2 pr-4 font-medium">Period</th>
										<th className="pb-2 pr-4 font-medium">Method</th>
										<th className="pb-2 pr-4 font-medium">Status</th>
										<th className="pb-2 font-medium">Created</th>
									</tr>
								</thead>
								<tbody>
									{payouts.map((payout) => (
										<tr
											key={payout.id}
											className="border-b border-border/50 last:border-0 hover:bg-muted/30"
										>
											<td className="py-3 pr-4 font-medium">
												{payout.sellerName ?? payout.sellerId.slice(0, 8)}
											</td>
											<td className="py-3 pr-4 tabular-nums">
												{formatPKR(payout.amount)}
											</td>
											<td className="py-3 pr-4 text-muted-foreground tabular-nums">
												{new Date(payout.periodStart).toLocaleDateString("en-PK", {
													month: "short",
													day: "numeric",
												})}
												{" – "}
												{new Date(payout.periodEnd).toLocaleDateString("en-PK", {
													month: "short",
													day: "numeric",
												})}
											</td>
											<td className="py-3 pr-4 text-muted-foreground">
												{payout.method ?? "—"}
											</td>
											<td className="py-3 pr-4">
												<Badge variant={statusVariant(payout.status)}>
													{payout.status}
												</Badge>
											</td>
											<td className="py-3 text-muted-foreground tabular-nums">
												{new Date(payout.createdAt).toLocaleDateString("en-PK", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
