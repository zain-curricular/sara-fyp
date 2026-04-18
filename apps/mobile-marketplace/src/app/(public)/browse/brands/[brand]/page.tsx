import { notFound } from "next/navigation";

import BrandModelsShell from "./shell";

import { getBrandBySlug, listActiveModelsByBrandId } from "@/lib/features/product-catalog/services";

export default async function BrandModelsPage({ params }: { params: Promise<{ brand: string }> }) {
	const { brand } = await params;

	const { data: brandRow, error: brandError } = await getBrandBySlug("mobile", brand);
	if (brandError) {
		throw new Error("Failed to load brand");
	}
	if (!brandRow) {
		notFound();
	}

	const { data: models, error: modelsError } = await listActiveModelsByBrandId(brandRow.id);
	if (modelsError) {
		throw new Error("Failed to load models");
	}

	return <BrandModelsShell brand={brandRow} models={models ?? []} />;
}
