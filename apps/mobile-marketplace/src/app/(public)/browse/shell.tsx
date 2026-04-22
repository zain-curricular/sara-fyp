// ============================================================================
// Browse Shell — Brand Catalog
// ============================================================================
//
// Entry to the catalog hierarchy: Brand → Model → Listings.
// Shows a search-style prompt, a "popular brands" hero row (first 6 brands),
// then the full brand grid below. All brands link to /browse/brands/[slug].

"use client";

import Link from "next/link";
import { Search } from "lucide-react";

import { BrandCard } from "./_components/brand-card";
import type { Brand } from "@/lib/features/product-catalog";

type BrowseBrandsShellProps = {
	brands: Brand[];
};

/** Main browse page — search prompt + brand grid. */
export default function BrowseBrandsShell({ brands }: BrowseBrandsShellProps) {
	const hasMany = brands.length > 6;
	const popular = hasMany ? brands.slice(0, 6) : [];
	const all = hasMany ? brands.slice(6) : brands;

	return (
		<div container-id="browse-shell" className="flex flex-col gap-10">

			{/* Hero */}
			<header container-id="browse-header" className="flex flex-col gap-4">
				<div className="flex flex-col gap-1">
					<p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
						Catalog
					</p>
					<h1 className="text-3xl font-bold tracking-tight">Browse by brand</h1>
					<p className="text-sm text-muted-foreground">
						{brands.length} brand{brands.length !== 1 ? "s" : ""} · pick one to explore models and listings.
					</p>
				</div>

				{/* Search shortcut */}
				<Link
					href="/search"
					className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:max-w-md"
				>
					<Search className="size-4 shrink-0" aria-hidden />
					Search across all brands and models…
				</Link>
			</header>

			{/* Popular brands — first 6, only when total > 6 */}
			{popular.length > 0 && (
				<section container-id="browse-popular">
					<p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
						Popular brands
					</p>
					<div
						container-id="browse-popular-grid"
						className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
					>
						{popular.map((brand) => (
							<BrandCard key={brand.id} brand={brand} href={`/browse/brands/${brand.slug}`} />
						))}
					</div>
				</section>
			)}

			{/* All brands grid */}
			{all.length > 0 && (
				<section container-id="browse-all-brands">
					{hasMany && (
						<p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
							All brands
						</p>
					)}
					<div
						container-id="browse-brands-grid"
						className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
					>
						{all.map((brand) => (
							<BrandCard key={brand.id} brand={brand} href={`/browse/brands/${brand.slug}`} />
						))}
					</div>
				</section>
			)}

			{brands.length === 0 && (
				<div
					container-id="browse-empty"
					className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center"
				>
					<p className="text-sm font-medium">No brands available yet.</p>
					<p className="text-xs text-muted-foreground">Check back soon.</p>
				</div>
			)}
		</div>
	);
}
