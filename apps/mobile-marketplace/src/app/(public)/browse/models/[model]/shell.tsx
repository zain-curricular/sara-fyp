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
		<div className="flex flex-col gap-6">
			<div className="space-y-2">
				<CategoryBreadcrumbs
					items={[
						{ label: "Browse", href: "/browse" },
						{ label: brand.name, href: `/browse/brands/${brand.slug}` },
						{ label: model.name },
					]}
				/>
				<h1 className="text-2xl font-semibold tracking-tight">{model.name}</h1>
				<p className="text-sm text-muted-foreground">
					{listings.length} listing{listings.length === 1 ? "" : "s"} found
				</p>
			</div>

			{variants.length ? (
				<div className="flex flex-wrap gap-2">
					{variants.map((variant, index) => (
						<Badge key={`${variant.key}-${variant.value}-${index}`} variant="secondary">
							{variant.key}: {variant.value}
						</Badge>
					))}
				</div>
			) : null}

			<div className="grid grid-cols-1 gap-3">
				{listings.map((listing) => (
					<ListingSummaryCard key={listing.id} listing={listing} />
				))}
				{listings.length === 0 ? (
					<Card size="sm">
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
