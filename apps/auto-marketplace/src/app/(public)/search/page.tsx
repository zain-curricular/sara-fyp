import SearchShell from "./shell";

import { searchListingsPublic } from "@/lib/features/listings/services";
import { listingsSearchParamsSchema } from "@/lib/features/listings";
import type { ListingsSearchParams } from "@/lib/features/listings";

export default async function SearchPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const raw = await searchParams;
	const flat: Record<string, string> = {};
	for (const [k, v] of Object.entries(raw)) {
		const val = Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
		if (val === "") continue;
		flat[k] = val;
	}

	const parsed = listingsSearchParamsSchema.safeParse({
		platform: "automotive",
		...flat,
	});

	const query: ListingsSearchParams = parsed.success
		? parsed.data
		: { platform: "automotive", page: 1, limit: 20 };

	const { data: listings, pagination, error } = await searchListingsPublic(query);
	if (error) {
		console.error("searchListingsPublic failed", { query, error });
		throw new Error("Failed to search listings");
	}

	return (
		<SearchShell listings={listings ?? []} pagination={pagination} params={query} />
	);
}
