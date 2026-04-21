"use client";

import { CategoryBreadcrumbs } from "../../_components/category-breadcrumbs";
import { ListingSummaryCard } from "../../_components/listing-summary-card";
import type { Brand, CatalogVariant, ListingSummary, Model } from "@/lib/features/product-catalog";
import { Badge } from "@/components/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

type ModelListingsShellProps = {
	model: Model;
	brand: Brand;
	listings: ListingSummary[];
	variants: CatalogVariant[];
};

export default function ModelListingsShell({
	model,
	brand,
	listings,
	variants,
}: ModelListingsShellProps) {
	return (
		<div container-id="model-listings-shell" className="flex flex-col gap-8">
			<header container-id="model-listings-header" className="flex flex-col gap-3">
				<CategoryBreadcrumbs
					items={[
						{ label: "Browse", href: "/browse" },
						{ label: brand.name, href: `/browse/brands/${brand.slug}` },
						{ label: model.name },
					]}
				/>
				<div className="flex flex-wrap items-end justify-between gap-3">
					<h1 className="text-3xl font-semibold tracking-tight">{model.name}</h1>
					<p className="text-sm text-muted-foreground tabular-nums">
						{listings.length} listing{listings.length === 1 ? "" : "s"} found
					</p>
				</div>
			</header>

			{variants.length ? (
				<div container-id="model-variants" className="flex flex-wrap gap-2">
					{variants.map((variant, index) => (
						<Badge key={`${variant.key}-${variant.value}-${index}`} variant="secondary">
							<span className="font-medium">{variant.key}:</span>
							<span className="ml-1">{variant.value}</span>
						</Badge>
					))}
				</div>
			) : null}

			<div container-id="model-listings-grid" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{listings.map((listing) => (
					<ListingSummaryCard key={listing.id} listing={listing} />
				))}
				{listings.length === 0 ? (
					<Card size="sm" className="sm:col-span-2">
						<CardHeader>
							<CardTitle className="text-base">No listings yet</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Try another model, or check back later.
							</p>
						</CardContent>
					</Card>
				) : null}
			</div>
		</div>
	);
}
