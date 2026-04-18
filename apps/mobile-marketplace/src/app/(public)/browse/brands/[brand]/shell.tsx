"use client";

import { CategoryBreadcrumbs } from "../../_components/category-breadcrumbs";
import { ModelCard } from "../../_components/model-card";
import type { Brand, Model } from "@/lib/features/product-catalog";

type BrandModelsShellProps = {
	brand: Brand;
	models: Model[];
};

export default function BrandModelsShell({ brand, models }: BrandModelsShellProps) {
	return (
		<div className="flex flex-col gap-6">
			<div className="space-y-2">
				<CategoryBreadcrumbs
					items={[
						{ label: "Browse", href: "/browse" },
						{ label: brand.name },
					]}
				/>
				<h1 className="text-2xl font-semibold tracking-tight">{brand.name}</h1>
				<p className="text-sm text-muted-foreground">Choose a model to see listings.</p>
			</div>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{models.map((model) => (
					<ModelCard key={model.id} model={model} href={`/browse/models/${model.id}`} />
				))}
			</div>
		</div>
	);
}
