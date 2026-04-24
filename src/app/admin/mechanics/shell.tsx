// ============================================================================
// Admin Mechanics Shell
// ============================================================================
//
// Table of mechanic profiles with verify/unverify toggle.
// Calls POST /api/admin/mechanics/[id]/verify { verified: boolean }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";
import { toast } from "sonner";

import type { AdminMechanic } from "@/lib/features/admin";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Props = {
	mechanics: AdminMechanic[];
};

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminMechanicsShell({ mechanics }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState<string | null>(null);

	async function toggleVerify(mechanicId: string, currentlyVerified: boolean) {
		setLoading(mechanicId);
		try {
			const res = await fetch(`/api/admin/mechanics/${mechanicId}/verify`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ verified: !currentlyVerified }),
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success(currentlyVerified ? "Mechanic unverified" : "Mechanic verified");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(null);
		}
	}

	return (
		<div container-id="admin-mechanics" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="admin-mechanics-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">Mechanics</h1>
				<p className="text-sm text-muted-foreground">{mechanics.length} mechanic(s)</p>
			</header>

			{/* Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Wrench className="size-4" aria-hidden />
						Mechanic profiles
					</CardTitle>
				</CardHeader>
				<CardContent>
					{mechanics.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">No mechanics found.</p>
					) : (
						<div container-id="admin-mechanics-table" className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border text-left text-xs text-muted-foreground">
										<th className="pb-2 pr-4 font-medium">Name</th>
										<th className="pb-2 pr-4 font-medium">Specialties</th>
										<th className="pb-2 pr-4 font-medium">Areas</th>
										<th className="pb-2 pr-4 font-medium">Jobs</th>
										<th className="pb-2 pr-4 font-medium">Rating</th>
										<th className="pb-2 pr-4 font-medium">Verified</th>
										<th className="pb-2 font-medium">Actions</th>
									</tr>
								</thead>
								<tbody>
									{mechanics.map((mechanic) => (
										<tr
											key={mechanic.id}
											className="border-b border-border/50 last:border-0 hover:bg-muted/30"
										>
											<td className="py-3 pr-4 font-medium">
												{mechanic.fullName ?? "—"}
											</td>
											<td className="py-3 pr-4">
												<div className="flex flex-wrap gap-1">
													{mechanic.specialties.slice(0, 2).map((s) => (
														<Badge key={s} variant="secondary" className="text-[10px]">
															{s}
														</Badge>
													))}
													{mechanic.specialties.length > 2 && (
														<span className="text-xs text-muted-foreground">
															+{mechanic.specialties.length - 2}
														</span>
													)}
												</div>
											</td>
											<td className="py-3 pr-4 text-muted-foreground">
												{mechanic.serviceAreas.slice(0, 2).join(", ")}
												{mechanic.serviceAreas.length > 2 && ` +${mechanic.serviceAreas.length - 2}`}
											</td>
											<td className="py-3 pr-4 tabular-nums">{mechanic.totalJobs}</td>
											<td className="py-3 pr-4 tabular-nums">
												{mechanic.rating.toFixed(1)}
											</td>
											<td className="py-3 pr-4">
												{mechanic.verified ? (
													<Badge variant="default">Verified</Badge>
												) : (
													<Badge variant="secondary">Unverified</Badge>
												)}
											</td>
											<td className="py-3">
												<Button
													variant={mechanic.verified ? "outline" : "default"}
													size="sm"
													onClick={() => toggleVerify(mechanic.id, mechanic.verified)}
													disabled={loading === mechanic.id}
												>
													{mechanic.verified ? "Unverify" : "Verify"}
												</Button>
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
