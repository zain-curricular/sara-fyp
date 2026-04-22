// ============================================================================
// Brand Models Shell
// ============================================================================
//
// Second level of the catalog hierarchy: shows all models for a given brand.
// Header has breadcrumbs + brand name + model count. Models grid links each
// ModelCard to /browse/models/[model.id].

"use client";

import { Smartphone } from "lucide-react";

import { CategoryBreadcrumbs } from "../../_components/category-breadcrumbs";
import { ModelCard } from "../../_components/model-card";
import type { Brand, Model } from "@/lib/features/product-catalog";

type BrandModelsShellProps = {
	brand: Brand;
	models: Model[];
};

/** Brand models page — breadcrumbs + model grid. */
export default function BrandModelsShell({ brand, models }: BrandModelsShellProps) {
	return (
		<div container-id="brand-models-shell" className="flex flex-col gap-8">

			{/* Header */}
			<header container-id="brand-models-header" className="flex flex-col gap-3">
				<CategoryBreadcrumbs
					items={[{ label: "Browse", href: "/browse" }, { label: brand.name }]}
				/>
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div className="flex flex-col gap-1">
						<h1 className="text-3xl font-bold tracking-tight">{brand.name}</h1>
						<p className="text-sm text-muted-foreground">
							{models.length} model{models.length !== 1 ? "s" : ""} · choose one to see listings.
						</p>
					</div>
				</div>
			</header>

			{/* Models grid */}
			{models.length > 0 ? (
				<div
					container-id="brand-models-grid"
					className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
				>
					{models.map((model) => (
						<ModelCard key={model.id} model={model} href={`/browse/models/${model.id}`} />
					))}
				</div>
			) : (
				<div
					container-id="brand-models-empty"
					className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center"
				>
					<Smartphone className="size-8 text-muted-foreground/30" aria-hidden />
					<p className="text-sm font-medium">No models listed yet for {brand.name}.</p>
					<p className="text-xs text-muted-foreground">Check back soon.</p>
				</div>
			)}
		</div>
	);
}
