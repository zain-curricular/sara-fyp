// ============================================================================
// Model Listings Shell
// ============================================================================
//
// Third level of the catalog hierarchy: all parts listings for a specific
// vehicle model. Header has breadcrumbs + model name + listing count. If the
// model has catalog variants, they appear as read-only info chips. Client-side
// sort (price low/high, newest) + optional quick filter toggle. Listings
// render as ListingSummaryCard in a 2-col grid.

"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";

import { CategoryBreadcrumbs } from "../../_components/category-breadcrumbs";
import { ListingSummaryCard } from "../../_components/listing-summary-card";
import type { Brand, CatalogVariant, ListingSummary, Model } from "@/lib/features/product-catalog";
import { Badge } from "@/components/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Sort config
// ----------------------------------------------------------------------------

type SortKey = "newest" | "price_asc" | "price_desc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
	{ key: "newest", label: "Newest" },
	{ key: "price_asc", label: "Price ↑" },
	{ key: "price_desc", label: "Price ↓" },
];

function sortListings(items: ListingSummary[], sort: SortKey): ListingSummary[] {
	const copy = [...items];
	if (sort === "price_asc") return copy.sort((a, b) => a.price - b.price);
	if (sort === "price_desc") return copy.sort((a, b) => b.price - a.price);
	return copy; // "newest" — preserve server order
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

type ModelListingsShellProps = {
	model: Model;
	brand: Brand;
	listings: ListingSummary[];
	variants: CatalogVariant[];
};

/** Model parts page — specs, sort chips, listing grid. */
export default function ModelListingsShell({
	model,
	brand,
	listings,
	variants,
}: ModelListingsShellProps) {
	const [sort, setSort] = useState<SortKey>("newest");

	const sorted = sortListings(listings, sort);

	return (
		<div container-id="model-listings-shell" className="flex flex-col gap-8">

			{/* Header */}
			<header container-id="model-listings-header" className="flex flex-col gap-3">
				<CategoryBreadcrumbs
					items={[
						{ label: "Browse", href: "/browse" },
						{ label: brand.name, href: `/browse/brands/${brand.slug}` },
						{ label: model.name },
					]}
				/>
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div className="flex flex-col gap-1">
						<h1 className="text-3xl font-bold tracking-tight">{model.name}</h1>
						<p className="text-sm text-muted-foreground tabular-nums">
							{listings.length} part{listings.length !== 1 ? "s" : ""} available
						</p>
					</div>
				</div>
			</header>

			{/* Variant chips */}
			{variants.length > 0 && (
				<div container-id="model-variants" className="flex flex-wrap gap-2">
					{variants.map((variant, i) => (
						<Badge key={`${variant.key}-${variant.value}-${i}`} variant="secondary">
							<span className="font-medium">{variant.key}:</span>
							<span className="ml-1">{variant.value}</span>
						</Badge>
					))}
				</div>
			)}

			{/* Sort row */}
			{listings.length > 1 && (
				<div container-id="model-listings-sort" className="flex items-center gap-2">
					<span className="text-xs text-muted-foreground">Sort:</span>
					{SORT_OPTIONS.map((opt) => (
						<button
							key={opt.key}
							type="button"
							onClick={() => setSort(opt.key)}
							className={cn(
								"rounded-full border px-3 py-1 text-xs font-medium transition-colors",
								sort === opt.key
									? "border-primary bg-primary/10 text-primary"
									: "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
							)}
						>
							{opt.label}
						</button>
					))}
				</div>
			)}

			{/* Listings grid */}
			{sorted.length > 0 ? (
				<div container-id="model-listings-grid" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{sorted.map((listing) => (
						<ListingSummaryCard key={listing.id} listing={listing} />
					))}
				</div>
			) : (
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-base">No parts listed yet</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col items-center gap-3 py-8 text-center">
						<Wrench className="size-8 text-muted-foreground/20" aria-hidden />
						<p className="text-sm text-muted-foreground">
							No parts listed for the {model.name} yet. Check back soon.
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
