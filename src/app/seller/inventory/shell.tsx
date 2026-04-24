// ============================================================================
// Seller Inventory Shell
// ============================================================================
//
// Client shell for inventory management. Shows a table of listings with stock
// counts. Allows inline stock quantity updates via PATCH /api/listings/[id].

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Separator } from "@/components/primitives/separator";
import { formatPKR } from "@/lib/utils/currency";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type InventoryListing = {
	id: string;
	title: string;
	price: number;
	status: string;
	stock: number | null;
	min_order_qty: number | null;
	created_at: string;
};

// ----------------------------------------------------------------------------
// Row
// ----------------------------------------------------------------------------

function InventoryRow({
	listing,
	onStockUpdated,
}: {
	listing: InventoryListing;
	onStockUpdated: (id: string, stock: number) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [stockValue, setStockValue] = useState(String(listing.stock ?? 1));
	const [saving, setSaving] = useState(false);

	async function saveStock() {
		const parsed = parseInt(stockValue, 10);
		if (isNaN(parsed) || parsed < 0) {
			toast.error("Stock must be a non-negative number");
			return;
		}

		setSaving(true);
		try {
			const res = await fetch(`/api/listings/${listing.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ stock: parsed }),
			});
			const json = await res.json();
			if (!json.ok) {
				toast.error(json.error ?? "Failed to update stock");
				return;
			}
			onStockUpdated(listing.id, parsed);
			setEditing(false);
			toast.success("Stock updated");
		} catch {
			toast.error("Network error — try again");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div
			container-id={`inventory-row-${listing.id}`}
			className="flex flex-wrap items-center gap-4 py-3"
		>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium">{listing.title}</p>
				<p className="text-xs text-muted-foreground">{formatPKR(listing.price)}</p>
			</div>

			<Badge
				variant={listing.status === "active" ? "default" : "secondary"}
				className="shrink-0 rounded-sm text-[10px]"
			>
				{listing.status.toUpperCase()}
			</Badge>

			<div className="flex items-center gap-2">
				{editing ? (
					<>
						<Input
							type="number"
							min={0}
							value={stockValue}
							onChange={(e) => setStockValue(e.target.value)}
							className="h-7 w-20 text-sm"
							onKeyDown={(e) => {
								if (e.key === "Enter") void saveStock();
								if (e.key === "Escape") setEditing(false);
							}}
							autoFocus
						/>
						<Button size="sm" onClick={() => void saveStock()} disabled={saving}>
							Save
						</Button>
						<Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
							Cancel
						</Button>
					</>
				) : (
					<>
						<span className="w-16 text-right text-sm tabular-nums">
							{listing.stock ?? "—"}
						</span>
						<Button
							size="icon"
							variant="ghost"
							className="size-7"
							onClick={() => setEditing(true)}
							aria-label="Edit stock"
						>
							<Pencil className="size-3.5" />
						</Button>
					</>
				)}
			</div>

			<Link href={`/seller/listings/${listing.id}/edit`}>
				<Button size="sm" variant="outline">
					Edit listing
				</Button>
			</Link>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function InventoryShell({ listings }: { listings: InventoryListing[] }) {
	const [items, setItems] = useState(listings);

	function handleStockUpdated(id: string, stock: number) {
		setItems((prev) => prev.map((l) => (l.id === id ? { ...l, stock } : l)));
	}

	return (
		<div container-id="inventory" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="inventory-header" className="flex items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
					<p className="text-sm text-muted-foreground">{items.length} listings</p>
				</div>

				<Link href="/seller/listings/new">
					<Button size="sm">Add listing</Button>
				</Link>
			</header>

			{/* Table header */}
			{items.length > 0 && (
				<div className="flex items-center gap-4 px-0 text-xs font-medium text-muted-foreground">
					<span className="flex-1">Listing</span>
					<span className="w-16">Status</span>
					<span className="w-20 text-right">Stock</span>
					<span className="w-7" />
					<span className="w-24" />
				</div>
			)}

			{/* Rows */}
			<div container-id="inventory-list" className="flex flex-col divide-y divide-border">
				{items.length === 0 ? (
					<p className="py-12 text-center text-sm text-muted-foreground">
						No listings yet.{" "}
						<Link href="/seller/listings/new" className="text-primary underline">
							Create your first listing
						</Link>
					</p>
				) : (
					items.map((listing, i) => (
						<InventoryRow
							key={listing.id}
							listing={listing}
							onStockUpdated={handleStockUpdated}
						/>
					))
				)}
			</div>
		</div>
	);
}
