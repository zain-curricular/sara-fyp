import { notFound } from "next/navigation";

import ModelListingsShell from "./shell";

import {
	getActiveModelById,
	getBrandById,
	getModelVariants,
	searchListingsByModelId,
} from "@/lib/features/product-catalog/services";

export default async function ModelListingsPage({ params }: { params: Promise<{ model: string }> }) {
	const { model } = await params;

	const { data: modelRow, error: modelError } = await getActiveModelById(model);
	if (modelError) {
		throw new Error("Failed to load model");
	}
	if (!modelRow) {
		notFound();
	}

	const [{ data: brandRow, error: brandError }, { data: variants, error: variantsError }, { data: listings, error: listingsError }] =
		await Promise.all([
			getBrandById(modelRow.brand_id),
			getModelVariants(modelRow.id),
			searchListingsByModelId(modelRow.id),
		]);

	if (brandError) {
		throw new Error("Failed to load brand");
	}
	if (!brandRow) {
		notFound();
	}
	if (variantsError) {
		throw new Error("Failed to load variants");
	}
	if (listingsError) {
		throw new Error("Failed to load listings");
	}

	return (
		<ModelListingsShell
			model={modelRow}
			brand={brandRow}
			listings={listings ?? []}
			variants={variants ?? []}
		/>
	);
}
