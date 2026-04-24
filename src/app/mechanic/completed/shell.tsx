// ============================================================================
// Mechanic Completed Shell
// ============================================================================
//
// Displays completed verification jobs in a table-like list with verdict
// badges, vehicle info, listing title, and date.

"use client";

import Link from "next/link";
import { CheckCircle2, Package, XCircle } from "lucide-react";

import type { MechanicVerificationRequest } from "@/lib/features/mechanic";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type MechanicCompletedShellProps = {
	requests: MechanicVerificationRequest[];
};

// ----------------------------------------------------------------------------
// Verdict badge
// ----------------------------------------------------------------------------

function VerdictBadge({ verdict }: { verdict: string | null }) {
	if (!verdict) return null;

	if (verdict === "verified_compatible") {
		return (
			<Badge className="rounded-sm bg-green-600 text-[10px] text-white hover:bg-green-600">
				<CheckCircle2 className="mr-1 size-3" aria-hidden />
				Compatible
			</Badge>
		);
	}

	if (verdict === "verified_incompatible") {
		return (
			<Badge className="rounded-sm bg-red-600 text-[10px] text-white hover:bg-red-600">
				<XCircle className="mr-1 size-3" aria-hidden />
				Incompatible
			</Badge>
		);
	}

	return (
		<Badge variant="secondary" className="rounded-sm text-[10px]">
			Insufficient info
		</Badge>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function MechanicCompletedShell({ requests }: MechanicCompletedShellProps) {
	return (
		<div container-id="mechanic-completed" className="flex flex-col gap-6">

			<header className="flex flex-col gap-1">
				<h1 className="text-2xl font-bold tracking-tight">Completed verifications</h1>
				<p className="text-sm text-muted-foreground">
					{requests.length} verification{requests.length !== 1 ? "s" : ""} completed
				</p>
			</header>

			{requests.length === 0 ? (
				<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
					<Package className="size-8 text-muted-foreground" aria-hidden />
					<p className="text-sm font-medium">No completed verifications yet</p>
					<p className="text-xs text-muted-foreground">
						Accept requests from the pool and submit verdicts to see them here.
					</p>
					<Link href="/mechanic/requests">
						<Button size="sm" variant="outline">Browse requests</Button>
					</Link>
				</div>
			) : (
				<Card size="sm">
					<CardContent className="flex flex-col gap-0 pt-4">
						{requests.map((req, i) => (
							<div key={req.id}>
								{i > 0 && <Separator />}
								<div className="flex items-center justify-between gap-4 py-3">
									<div className="flex min-w-0 flex-col gap-1">
										<p className="truncate text-sm font-medium">
											{req.listing?.title ?? "Part verification"}
										</p>
										<div className="flex flex-wrap items-center gap-2">
											<VerdictBadge verdict={req.verdict} />
											{req.respondedAt && (
												<span className="text-xs text-muted-foreground">
													{new Date(req.respondedAt).toLocaleDateString()}
												</span>
											)}
											{req.listing?.city && (
												<span className="text-xs text-muted-foreground">{req.listing.city}</span>
											)}
										</div>
									</div>
									<Link href={`/mechanic/requests/${req.id}`}>
										<Button size="sm" variant="outline" className="shrink-0">
											View
										</Button>
									</Link>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
