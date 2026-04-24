// ============================================================================
// Admin Listings Shell
// ============================================================================
//
// Filterable table of listings with approve/reject inline actions.
// Status filter pushes to URL params to re-run the RSC.

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Search } from "lucide-react";
import { toast } from "sonner";

import type { AdminListing } from "@/lib/features/admin";
import { formatPKR } from "@/lib/utils/currency";

import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Props = {
	listings: AdminListing[];
	initialStatus: string;
	initialSearch: string;
};

// ----------------------------------------------------------------------------
// Status tabs
// ----------------------------------------------------------------------------

const STATUS_TABS = [
	{ value: "all", label: "All" },
	{ value: "pending_review", label: "Pending Review" },
	{ value: "active", label: "Active" },
	{ value: "rejected", label: "Rejected" },
	{ value: "draft", label: "Draft" },
] as const;

// ----------------------------------------------------------------------------
// Status badge colour
// ----------------------------------------------------------------------------

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
	if (status === "active") return "default";
	if (status === "rejected") return "destructive";
	if (status === "pending_review") return "secondary";
	return "outline";
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminListingsShell({ listings, initialStatus, initialSearch }: Props) {
	const router = useRouter();
	const [search, setSearch] = useState(initialSearch);
	const [status, setStatus] = useState(initialStatus);
	const [loading, setLoading] = useState<string | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Debounced URL push
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			const params = new URLSearchParams();
			if (search) params.set("search", search);
			if (status !== "all") params.set("status", status);
			router.push(`/admin/listings?${params.toString()}`);
		}, 350);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [search, status, router]);

	async function approve(listingId: string) {
		setLoading(listingId);
		try {
			const res = await fetch(`/api/admin/listings/${listingId}/approve`, { method: "POST" });
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Listing approved");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(null);
		}
	}

	async function reject(listingId: string) {
		const reason = window.prompt("Reason for rejection:");
		if (!reason) return;
		setLoading(listingId);
		try {
			const res = await fetch(`/api/admin/listings/${listingId}/reject`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reason }),
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Listing rejected");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(null);
		}
	}

	return (
		<div container-id="admin-listings" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="admin-listings-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">Listings</h1>
				<p className="text-sm text-muted-foreground">{listings.length} result(s)</p>
			</header>

			{/* Controls */}
			<div container-id="admin-listings-controls" className="flex flex-col gap-3">
				<div className="relative w-full max-w-sm">
					<Search
						className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
						aria-hidden
					/>
					<Input
						placeholder="Search title…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-8"
					/>
				</div>
				<div className="flex flex-wrap gap-1">
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
			</div>

			{/* Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Package className="size-4" aria-hidden />
						Listings
					</CardTitle>
				</CardHeader>
				<CardContent>
					{listings.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">No listings found.</p>
					) : (
						<div container-id="admin-listings-table" className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border text-left text-xs text-muted-foreground">
										<th className="pb-2 pr-4 font-medium">Title</th>
										<th className="pb-2 pr-4 font-medium">Store</th>
										<th className="pb-2 pr-4 font-medium">Price</th>
										<th className="pb-2 pr-4 font-medium">Condition</th>
										<th className="pb-2 pr-4 font-medium">Status</th>
										<th className="pb-2 pr-4 font-medium">Views</th>
										<th className="pb-2 pr-4 font-medium">Actions</th>
										<th className="pb-2" />
									</tr>
								</thead>
								<tbody>
									{listings.map((listing) => (
										<tr
											key={listing.id}
											className="border-b border-border/50 last:border-0 hover:bg-muted/30"
										>
											<td className="py-3 pr-4 font-medium">{listing.title}</td>
											<td className="py-3 pr-4 text-muted-foreground">
												{listing.storeName ?? "—"}
											</td>
											<td className="py-3 pr-4 tabular-nums">{formatPKR(listing.price)}</td>
											<td className="py-3 pr-4 text-muted-foreground capitalize">
												{listing.condition}
											</td>
											<td className="py-3 pr-4">
												<Badge variant={statusVariant(listing.status)}>
													{listing.status.replace(/_/g, " ")}
												</Badge>
											</td>
											<td className="py-3 pr-4 tabular-nums">{listing.viewCount}</td>
											<td className="py-3 pr-4">
												<div className="flex gap-1">
													{listing.status !== "active" && (
														<Button
															variant="outline"
															size="sm"
															onClick={() => approve(listing.id)}
															disabled={loading === listing.id}
														>
															Approve
														</Button>
													)}
													{listing.status !== "rejected" && (
														<Button
															variant="destructive"
															size="sm"
															onClick={() => reject(listing.id)}
															disabled={loading === listing.id}
														>
															Reject
														</Button>
													)}
												</div>
											</td>
											<td className="py-3 text-right">
												<Link
													href={`/admin/listings/${listing.id}`}
													className={buttonVariants({ variant: "ghost", size: "sm" })}
												>
													View
												</Link>
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
