// ============================================================================
// Seller Listings Shell
// ============================================================================
//
// My listings management page. Four-tab filter (All / Published / Drafts /
// Sold) + stats row at the top. Each listing renders as a compact row with
// an image placeholder, title, condition badge, price, status badge, and
// quick-action links (View, Edit). "New listing" CTA in the header.
//
// Data: receives ListingRecord[] from the RSC. Status values: "draft",
// "active" (published), "paused", "sold".

"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageIcon, Pencil, Plus } from "lucide-react";

import type { ListingRecord } from "@/lib/features/listings";
import { Badge } from "@/components/primitives/badge";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Status config
// ----------------------------------------------------------------------------

type StatusKey = "active" | "draft" | "paused" | "sold";

const STATUS_META: Record<StatusKey, { label: string; badgeVariant: "default" | "secondary" | "outline" }> = {
	active: { label: "Published", badgeVariant: "default" },
	draft: { label: "Draft", badgeVariant: "secondary" },
	paused: { label: "Paused", badgeVariant: "outline" },
	sold: { label: "Sold", badgeVariant: "secondary" },
};

function statusMeta(status: string) {
	return STATUS_META[status as StatusKey] ?? { label: status, badgeVariant: "secondary" as const };
}

// ----------------------------------------------------------------------------
// Tab config
// ----------------------------------------------------------------------------

type Tab = "all" | StatusKey;

const TABS: { key: Tab; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "active", label: "Published" },
	{ key: "draft", label: "Drafts" },
	{ key: "paused", label: "Paused" },
	{ key: "sold", label: "Sold" },
];

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const CONDITION_LABELS: Record<string, string> = {
	new: "New",
	like_new: "Like New",
	excellent: "Excellent",
	good: "Good",
	fair: "Fair",
	poor: "Poor",
};

function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
	} catch {
		return iso;
	}
}

// ----------------------------------------------------------------------------
// Listing row
// ----------------------------------------------------------------------------

function ListingRow({ listing }: { listing: ListingRecord }) {
	const meta = statusMeta(listing.status);
	return (
		<Card size="sm" container-id="seller-listing-row">
			<CardContent className="flex items-start gap-3 py-3">

				{/* Image placeholder */}
				<div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted/40">
					<ImageIcon className="size-5 text-muted-foreground/30" aria-hidden />
				</div>

				{/* Details */}
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<p className="line-clamp-1 text-sm font-semibold">{listing.title}</p>
					<div className="flex flex-wrap items-center gap-1.5">
						<Badge variant="secondary" className="rounded-sm text-[10px]">
							{CONDITION_LABELS[listing.condition] ?? listing.condition}
						</Badge>
						{listing.sale_type !== "fixed" && (
							<Badge className="rounded-sm text-[10px]">LIVE</Badge>
						)}
					</div>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<span className="text-sm font-bold tabular-nums text-primary">
								${listing.price.toLocaleString()}
							</span>
							<Badge variant={meta.badgeVariant} className="rounded-sm text-[10px]">
								{meta.label}
							</Badge>
						</div>
						<span className="text-[10px] text-muted-foreground">{formatDate(listing.created_at)}</span>
					</div>
				</div>

				{/* Actions */}
				<div className="flex shrink-0 flex-col gap-1.5">
					<Link
						href={`/listings/${listing.id}`}
						className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 px-2.5 text-xs")}
					>
						View
					</Link>
					<Link
						href={`/seller/listings/${listing.id}/edit`}
						className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 gap-1 px-2.5 text-xs")}
					>
						<Pencil className="size-3" aria-hidden />
						Edit
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

type SellerListingsShellProps = {
	listings: ListingRecord[];
};

/** Seller listing management — tabs, stats, and per-listing rows. */
export default function SellerListingsShell({ listings }: SellerListingsShellProps) {
	const [tab, setTab] = useState<Tab>("all");

	const counts = {
		all: listings.length,
		active: listings.filter((l) => l.status === "active").length,
		draft: listings.filter((l) => l.status === "draft").length,
		paused: listings.filter((l) => l.status === "paused").length,
		sold: listings.filter((l) => l.status === "sold").length,
	};

	const visible = tab === "all" ? listings : listings.filter((l) => l.status === tab);

	const totalRevenue = listings
		.filter((l) => l.status === "sold")
		.reduce((n, l) => n + l.price, 0);

	return (
		<div container-id="seller-listings-shell" className="flex flex-col gap-6">

			{/* Header */}
			<header
				container-id="seller-listings-header"
				className="flex flex-wrap items-end justify-between gap-3"
			>
				<div className="flex flex-col gap-1">
					<h1 className="text-3xl font-bold tracking-tight">My listings</h1>
					<p className="text-sm text-muted-foreground">Manage drafts and published phones.</p>
				</div>
				<Link href="/seller/listings/new" className={cn(buttonVariants(), "gap-1.5")}>
					<Plus className="size-4" aria-hidden />
					New listing
				</Link>
			</header>

			{/* Stats row */}
			<div container-id="seller-listings-stats" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{[
					{ label: "Total", value: counts.all },
					{ label: "Published", value: counts.active },
					{ label: "Drafts", value: counts.draft },
					{ label: "Revenue", value: totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : "—" },
				].map((stat) => (
					<Card key={stat.label} size="sm">
						<CardContent className="flex flex-col gap-0.5 pt-3">
							<p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
								{stat.label}
							</p>
							<p className="text-xl font-bold tabular-nums">{stat.value}</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Tabs */}
			<div
				container-id="seller-listings-tabs"
				className="flex gap-1 overflow-x-auto border-b border-border pb-0"
				role="tablist"
			>
				{TABS.map((t) => (
					<button
						key={t.key}
						type="button"
						role="tab"
						aria-selected={tab === t.key}
						onClick={() => setTab(t.key)}
						className={cn(
							"flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-2 pt-1 text-sm font-medium transition-colors",
							tab === t.key
								? "border-primary text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground",
						)}
					>
						{t.label}
						<span
							className={cn(
								"rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
								tab === t.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
							)}
						>
							{counts[t.key]}
						</span>
					</button>
				))}
			</div>

			{/* Listing rows */}
			{visible.length === 0 ? (
				<div
					container-id="seller-listings-empty"
					className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center"
				>
					<p className="text-sm font-medium">No listings here.</p>
					{tab === "all" ? (
						<Link
							href="/seller/listings/new"
							className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
						>
							Create your first listing
						</Link>
					) : (
						<p className="text-xs text-muted-foreground">
							Switch to "All" to see every listing.
						</p>
					)}
				</div>
			) : (
				<div container-id="seller-listings-list" className="flex flex-col gap-2">
					{visible.map((listing) => (
						<ListingRow key={listing.id} listing={listing} />
					))}
				</div>
			)}
		</div>
	);
}
