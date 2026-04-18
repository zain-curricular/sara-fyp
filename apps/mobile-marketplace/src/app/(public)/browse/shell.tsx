"use client";

import { BrandCard } from "./_components/brand-card";
import type { Brand } from "@/lib/features/product-catalog";

type BrowseBrandsShellProps = {
	brands: Brand[];
};

export default function BrowseBrandsShell({ brands }: BrowseBrandsShellProps) {
	return (
		<div className="flex flex-col gap-6">
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight">Browse brands</h1>
				<p className="text-sm text-muted-foreground">Pick a brand to see available models.</p>
			</div>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{brands.map((brand) => (
					<BrandCard key={brand.id} brand={brand} href={`/browse/brands/${brand.slug}`} />
				))}
			</div>
		</div>
	);
}
