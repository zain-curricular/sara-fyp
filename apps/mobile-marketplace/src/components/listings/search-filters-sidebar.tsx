"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ListingsSearchParams } from "@/lib/features/listings";
import { Button } from "@/components/primitives/button";
import { Field, FieldLabel } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

type SearchFiltersSidebarProps = {
	initial: ListingsSearchParams;
	basePath?: string;
};

function buildHref(basePath: string, next: ListingsSearchParams): string {
	const sp = new URLSearchParams();
	sp.set("platform", "mobile");
	if (next.q) sp.set("q", next.q);
	if (next.city) sp.set("city", next.city);
	if (next.price_min !== undefined) sp.set("price_min", String(next.price_min));
	if (next.price_max !== undefined) sp.set("price_max", String(next.price_max));
	if (next.model_id) sp.set("model_id", next.model_id);
	if (next.category_id) sp.set("category_id", next.category_id);
	if (next.page && next.page > 1) sp.set("page", String(next.page));
	if (next.limit && next.limit !== 20) sp.set("limit", String(next.limit));
	const qs = sp.toString();
	return qs ? `${basePath}?${qs}` : `${basePath}?platform=mobile`;
}

export function SearchFiltersSidebar({ initial, basePath = "/search" }: SearchFiltersSidebarProps) {
	const router = useRouter();
	const [q, setQ] = useState(initial.q ?? "");
	const [city, setCity] = useState(initial.city ?? "");
	const [priceMin, setPriceMin] = useState(initial.price_min?.toString() ?? "");
	const [priceMax, setPriceMax] = useState(initial.price_max?.toString() ?? "");

	function apply() {
		const next: ListingsSearchParams = {
			platform: "mobile",
			q: q.trim() || undefined,
			city: city.trim() || undefined,
			price_min: priceMin ? Number(priceMin) : undefined,
			price_max: priceMax ? Number(priceMax) : undefined,
			model_id: initial.model_id,
			category_id: initial.category_id,
			page: 1,
			limit: initial.limit ?? 20,
		};
		router.push(buildHref(basePath, next));
	}

	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle className="text-base">Filters</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<Field>
					<FieldLabel htmlFor="search-q">Keyword</FieldLabel>
					<Input
						id="search-q"
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Search title…"
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="search-city">City</FieldLabel>
					<Input
						id="search-city"
						value={city}
						onChange={(e) => setCity(e.target.value)}
						placeholder="City"
					/>
				</Field>
				<div className="grid grid-cols-2 gap-2">
					<Field>
						<FieldLabel htmlFor="search-pmin">Min price</FieldLabel>
						<Input
							id="search-pmin"
							inputMode="numeric"
							value={priceMin}
							onChange={(e) => setPriceMin(e.target.value)}
							placeholder="0"
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="search-pmax">Max price</FieldLabel>
						<Input
							id="search-pmax"
							inputMode="numeric"
							value={priceMax}
							onChange={(e) => setPriceMax(e.target.value)}
							placeholder="∞"
						/>
					</Field>
				</div>
				<Button type="button" onClick={apply}>
					Apply
				</Button>
			</CardContent>
		</Card>
	);
}
