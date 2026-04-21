"use client";

import { BrandCard } from "./_components/brand-card";
import type { Brand } from "@/lib/features/product-catalog";

type BrowseBrandsShellProps = {
	brands: Brand[];
};

export default function BrowseBrandsShell({ brands }: BrowseBrandsShellProps) {
	return (
		<div container-id="browse-shell" className="flex flex-col gap-8">
			<header container-id="browse-header" className="flex flex-col gap-2">
				<p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
					Catalog
				</p>
				<h1 className="text-3xl font-semibold tracking-tight">Browse brands</h1>
				<p className="text-sm text-muted-foreground">Pick a brand to see available models.</p>
			</header>

			<div
				container-id="browse-brands-grid"
				className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
			>
				{brands.map((brand) => (
					<BrandCard key={brand.id} brand={brand} href={`/browse/brands/${brand.slug}`} />
				))}
			</div>
		</div>
	);
}
