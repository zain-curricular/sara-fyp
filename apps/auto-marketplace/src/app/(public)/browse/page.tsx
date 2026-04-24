import BrowseBrandsShell from "./shell";

import { listBrandsByPlatform } from "@/lib/features/product-catalog/services";

export default async function BrowseBrandsPage() {
	const { data, error } = await listBrandsByPlatform("automotive");
	if (error) {
		console.error("listBrandsByPlatform(automotive) failed", error);
		throw new Error("Failed to load brands");
	}

	return <BrowseBrandsShell brands={data ?? []} />;
}
