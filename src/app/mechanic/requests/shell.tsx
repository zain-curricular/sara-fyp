// ============================================================================
// Mechanic Requests Shell
// ============================================================================
//
// Client shell for the pending request pool. Each card shows vehicle info,
// listing, buyer city, and an Accept button that calls the accept API.

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MapPin, Package } from "lucide-react";

import type { MechanicVerificationRequest } from "@/lib/features/mechanic";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type MechanicRequestsShellProps = {
	requests: MechanicVerificationRequest[];
};

// ----------------------------------------------------------------------------
// Request card
// ----------------------------------------------------------------------------

function RequestCard({ req }: { req: MechanicVerificationRequest }) {
	const [accepting, setAccepting] = useState(false);
	const [accepted, setAccepted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleAccept() {
		setAccepting(true);
		setError(null);
		try {
			const res = await fetch(`/api/mechanic/requests/${req.id}/accept`, {
				method: "POST",
			});
			const json = await res.json();
			if (!json.ok) throw new Error(json.error ?? "Failed to accept");
			setAccepted(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error");
		} finally {
			setAccepting(false);
		}
	}

	if (accepted) {
		return (
			<Card size="sm" className="border-primary/30 bg-primary/5">
				<CardContent className="flex items-center justify-between gap-4 py-4">
					<div className="flex flex-col gap-0.5">
						<p className="text-sm font-medium">{req.listing?.title}</p>
						<p className="text-xs text-primary">Request accepted. Check your assigned list.</p>
					</div>
					<Link href={`/mechanic/requests/${req.id}`}>
						<Button size="sm">View</Button>
					</Link>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card size="sm">
			<CardContent className="flex gap-4 py-4">

				{/* Listing image */}
				<div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
					{req.listing?.imageUrl ? (
						<Image
							src={req.listing.imageUrl}
							alt={req.listing.title}
							fill
							className="object-cover"
							sizes="64px"
						/>
					) : (
						<div className="flex h-full items-center justify-center">
							<Package className="size-6 text-muted-foreground" aria-hidden />
						</div>
					)}
				</div>

				{/* Info */}
				<div className="flex min-w-0 flex-1 flex-col gap-1.5">
					<div className="flex items-start justify-between gap-2">
						<p className="truncate text-sm font-semibold">
							{req.listing?.title ?? "Part verification"}
						</p>
						<Badge variant="secondary" className="shrink-0 rounded-sm text-[10px]">PENDING</Badge>
					</div>

					{req.listing?.city && (
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							<MapPin className="size-3" aria-hidden />
							{req.listing.city}
						</div>
					)}

					{req.vehicle && (
						<p className="text-xs text-muted-foreground">
							{[req.vehicle.year, req.vehicle.make, req.vehicle.model]
								.filter(Boolean)
								.join(" ")}
						</p>
					)}

					<p className="text-xs text-muted-foreground">
						{new Date(req.createdAt).toLocaleDateString()}
					</p>
				</div>

				{/* Actions */}
				<div className="flex shrink-0 flex-col gap-2">
					<Link href={`/mechanic/requests/${req.id}`}>
						<Button size="sm" variant="outline" className="w-full">
							Details
						</Button>
					</Link>
					<Button
						size="sm"
						onClick={handleAccept}
						disabled={accepting}
						className="w-full"
					>
						{accepting ? "Accepting…" : "Accept"}
					</Button>
					{error && <p className="text-xs text-destructive">{error}</p>}
				</div>
			</CardContent>
		</Card>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function MechanicRequestsShell({ requests }: MechanicRequestsShellProps) {
	return (
		<div container-id="mechanic-requests" className="flex flex-col gap-6">

			<header className="flex flex-col gap-1">
				<h1 className="text-2xl font-bold tracking-tight">Verification requests</h1>
				<p className="text-sm text-muted-foreground">
					Pending requests in your service areas. Accept one to begin verification.
				</p>
			</header>

			{requests.length === 0 ? (
				<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
					<Package className="size-8 text-muted-foreground" aria-hidden />
					<p className="text-sm font-medium">No pending requests in your area</p>
					<p className="text-xs text-muted-foreground max-w-xs">
						New requests will appear here when buyers in your service cities submit a
						verification job.
					</p>
				</div>
			) : (
				<div container-id="mechanic-requests-list" className="flex flex-col gap-3">
					{requests.map((req) => (
						<RequestCard key={req.id} req={req} />
					))}
				</div>
			)}
		</div>
	);
}
