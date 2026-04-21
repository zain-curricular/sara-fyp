"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CategoryOption, ListingRecord } from "@/lib/features/listings";
import { useUpdateListing } from "@/lib/features/listings";
import type { CreateListingWizardInput } from "@/lib/features/listings";
import { Button } from "@/components/primitives/button";
import { Field, FieldLabel } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/primitives/select";
import { Textarea } from "@/components/primitives/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

type ListingEditFormProps = {
	listing: ListingRecord;
	categories: CategoryOption[];
};

const CONDITIONS = ["new", "like_new", "excellent", "good", "fair", "poor"] as const;

export function ListingEditForm({ listing, categories }: ListingEditFormProps) {
	const router = useRouter();
	const update = useUpdateListing();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [categoryId, setCategoryId] = useState(listing.category_id);
	const [title, setTitle] = useState(listing.title);
	const [description, setDescription] = useState(listing.description ?? "");
	const [price, setPrice] = useState(String(listing.price));
	const [city, setCity] = useState(listing.city);
	const [condition, setCondition] = useState(listing.condition as (typeof CONDITIONS)[number]);

	async function onSave() {
		setError(null);
		setBusy(true);
		try {
			const patch: Partial<CreateListingWizardInput> = {
				category_id: categoryId,
				title: title.trim(),
				description: description.trim() || null,
				price: Number(price),
				condition,
				city: city.trim(),
			};
			await update(listing.id, patch);
			router.refresh();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Update failed");
		} finally {
			setBusy(false);
		}
	}

	return (
		<Card size="sm" container-id="listing-edit-form">
			<CardHeader>
				<CardTitle className="text-base">Edit listing</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-5">
				{error ? (
					<p
						role="alert"
						className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
					>
						{error}
					</p>
				) : null}
				<Field>
					<FieldLabel>Category</FieldLabel>
					<Select
						value={categoryId}
						onValueChange={(v) => {
							if (v) setCategoryId(v);
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{categories.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				<Field>
					<FieldLabel htmlFor="ed-title">Title</FieldLabel>
					<Input id="ed-title" value={title} onChange={(e) => setTitle(e.target.value)} />
				</Field>
				<Field>
					<FieldLabel htmlFor="ed-desc">Description</FieldLabel>
					<Textarea
						id="ed-desc"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={4}
					/>
				</Field>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Field>
						<FieldLabel htmlFor="ed-price">Price</FieldLabel>
						<Input
							id="ed-price"
							inputMode="decimal"
							value={price}
							onChange={(e) => setPrice(e.target.value)}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="ed-city">City</FieldLabel>
						<Input id="ed-city" value={city} onChange={(e) => setCity(e.target.value)} />
					</Field>
				</div>
				<Field>
					<FieldLabel>Condition</FieldLabel>
					<Select
						value={condition}
						onValueChange={(v) => {
							if (v) setCondition(v as (typeof CONDITIONS)[number]);
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{CONDITIONS.map((c) => (
								<SelectItem key={c} value={c}>
									{c}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				<Button
					type="button"
					className="w-full sm:w-fit sm:self-end"
					disabled={busy}
					onClick={() => void onSave()}
				>
					Save changes
				</Button>
			</CardContent>
		</Card>
	);
}
