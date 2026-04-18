import BrowseBrandsShell from "./shell";

import { listBrandsByPlatform } from "@/lib/features/product-catalog/services";

export default async function BrowseBrandsPage() {
	const { data, error } = await listBrandsByPlatform("mobile");
	if (error) {
		throw new Error("Failed to load brands");
	}

	return <BrowseBrandsShell brands={data ?? []} />;
}

