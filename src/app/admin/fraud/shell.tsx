// ============================================================================
// Admin Fraud Signals Shell
// ============================================================================
//
// Table of fraud signals with dismiss/action buttons.
// Dismiss: POST /api/admin/fraud/[id]/dismiss
// Action: POST /api/admin/fraud/[id]/action (prompt for note)

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import type { FraudSignal } from "@/lib/features/admin";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Props = {
	signals: FraudSignal[];
	initialStatus: string;
};

// ----------------------------------------------------------------------------
// Status tabs
// ----------------------------------------------------------------------------

const STATUS_TABS = [
	{ value: "all", label: "All" },
	{ value: "open", label: "Open" },
	{ value: "dismissed", label: "Dismissed" },
	{ value: "actioned", label: "Actioned" },
] as const;

// ----------------------------------------------------------------------------
// Score colour
// ----------------------------------------------------------------------------

function scoreVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
	if (score >= 80) return "destructive";
	if (score >= 50) return "secondary";
	return "outline";
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminFraudShell({ signals, initialStatus }: Props) {
	const router = useRouter();
	const [status, setStatus] = useState(initialStatus);
	const [loading, setLoading] = useState<string | null>(null);

	function filterSignals(s: FraudSignal[]) {
		if (status === "all") return s;
		return s.filter((sig) => sig.status === status);
	}

	async function dismiss(signalId: string) {
		setLoading(signalId);
		try {
			const res = await fetch(`/api/admin/fraud/${signalId}/dismiss`, { method: "POST" });
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Signal dismissed");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(null);
		}
	}

	async function action(signalId: string) {
		const note = window.prompt("Action note (required):");
		if (!note) return;
		setLoading(signalId);
		try {
			const res = await fetch(`/api/admin/fraud/${signalId}/action`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ note }),
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Signal actioned");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(null);
		}
	}

	const filtered = filterSignals(signals);

	return (
		<div container-id="admin-fraud" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="admin-fraud-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">Fraud Signals</h1>
				<p className="text-sm text-muted-foreground">{filtered.length} signal(s)</p>
			</header>

			{/* Status filter */}
			<div container-id="admin-fraud-filter" className="flex flex-wrap gap-1">
				{STATUS_TABS.map((tab) => (
					<Button
						key={tab.value}
						variant={status === tab.value ? "default" : "outline"}
						size="sm"
						onClick={() => setStatus(tab.value)}
					>
						{tab.label}
					</Button>
				))}
			</div>

			{/* Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<AlertTriangle className="size-4" aria-hidden />
						Fraud signals
					</CardTitle>
				</CardHeader>
				<CardContent>
					{filtered.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">No signals found.</p>
					) : (
						<div container-id="admin-fraud-table" className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border text-left text-xs text-muted-foreground">
										<th className="pb-2 pr-4 font-medium">Type</th>
										<th className="pb-2 pr-4 font-medium">Subject</th>
										<th className="pb-2 pr-4 font-medium">Score</th>
										<th className="pb-2 pr-4 font-medium">Status</th>
										<th className="pb-2 pr-4 font-medium">Created</th>
										<th className="pb-2 font-medium">Actions</th>
									</tr>
								</thead>
								<tbody>
									{filtered.map((signal) => (
										<tr
											key={signal.id}
											className="border-b border-border/50 last:border-0 hover:bg-muted/30"
										>
											<td className="py-3 pr-4 font-medium">
												{signal.signalType.replace(/_/g, " ")}
											</td>
											<td className="py-3 pr-4">
												<div className="flex flex-col gap-0.5">
													<span className="text-xs text-muted-foreground">
														{signal.subjectType}
													</span>
													<span className="font-mono text-xs">{signal.subjectId}</span>
												</div>
											</td>
											<td className="py-3 pr-4">
												<Badge variant={scoreVariant(signal.score)}>
													{signal.score}
												</Badge>
											</td>
											<td className="py-3 pr-4">
												<Badge variant={signal.status === "open" ? "destructive" : "outline"}>
													{signal.status}
												</Badge>
											</td>
											<td className="py-3 pr-4 text-muted-foreground tabular-nums">
												{new Date(signal.createdAt).toLocaleDateString("en-PK", {
													month: "short",
													day: "numeric",
												})}
											</td>
											<td className="py-3">
												{signal.status === "open" && (
													<div className="flex gap-1">
														<Button
															variant="outline"
															size="sm"
															onClick={() => action(signal.id)}
															disabled={loading === signal.id}
														>
															Action
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => dismiss(signal.id)}
															disabled={loading === signal.id}
														>
															Dismiss
														</Button>
													</div>
												)}
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
