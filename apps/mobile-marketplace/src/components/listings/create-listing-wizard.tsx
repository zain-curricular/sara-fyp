"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CategoryOption, CreateListingWizardInput } from "@/lib/features/listings";
import { useCreateListing, usePublishListing, useUploadImages } from "@/lib/features/listings";
import { Button } from "@/components/primitives/button";
import { Field, FieldLabel } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/primitives/select";
import { Textarea } from "@/components/primitives/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

import { ImageDropzone } from "@/components/listings/image-dropzone";

type CreateListingWizardProps = {
	categories: CategoryOption[];
};

const CONDITIONS = ["new", "like_new", "excellent", "good", "fair", "poor"] as const;

export function CreateListingWizard({ categories }: CreateListingWizardProps) {
	const router = useRouter();
	const createListing = useCreateListing();
	const uploadImage = useUploadImages();
	const publishListing = usePublishListing();

	const [step, setStep] = useState<1 | 2 | 3>(1);
	const [listingId, setListingId] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [city, setCity] = useState("");
	const [condition, setCondition] = useState<(typeof CONDITIONS)[number]>("good");

	async function submitBasics() {
		setError(null);
		setBusy(true);
		try {
			const body: CreateListingWizardInput = {
				platform: "mobile",
				category_id: categoryId,
				model_id: null,
				title: title.trim(),
				description: description.trim() || null,
				sale_type: "fixed",
				price: Number(price),
				is_negotiable: false,
				condition,
				details: {},
				city: city.trim(),
				area: null,
			};
			const row = await createListing(body);
			setListingId(row.id);
			setStep(2);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Could not create draft");
		} finally {
			setBusy(false);
		}
	}

	async function onUpload(file: File) {
		if (!listingId) return;
		setError(null);
		setBusy(true);
		try {
			await uploadImage(listingId, file);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Upload failed");
		} finally {
			setBusy(false);
		}
	}

	async function onPublish() {
		if (!listingId) return;
		setError(null);
		setBusy(true);
		try {
			await publishListing(listingId);
			router.push(`/listings/${listingId}`);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Publish failed");
		} finally {
			setBusy(false);
		}
	}

	if (!categories.length) {
		return (
			<p className="text-sm text-muted-foreground">
				No categories available. Seed the catalog first.
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex gap-2 text-sm text-muted-foreground">
				<span className={step >= 1 ? "text-foreground" : ""}>1. Details</span>
				<span>→</span>
				<span className={step >= 2 ? "text-foreground" : ""}>2. Photos</span>
				<span>→</span>
				<span className={step >= 3 ? "text-foreground" : ""}>3. Publish</span>
			</div>

			{error ? <p className="text-sm text-destructive">{error}</p> : null}

			{step === 1 ? (
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-base">Listing details</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<Field>
							<FieldLabel>Category</FieldLabel>
							<Select
								value={categoryId}
								onValueChange={(v) => {
									if (v) setCategoryId(v);
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Category" />
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
							<FieldLabel htmlFor="lst-title">Title</FieldLabel>
							<Input id="lst-title" value={title} onChange={(e) => setTitle(e.target.value)} />
						</Field>
						<Field>
							<FieldLabel htmlFor="lst-desc">Description</FieldLabel>
							<Textarea
								id="lst-desc"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={4}
							/>
						</Field>
						<div className="grid grid-cols-2 gap-3">
							<Field>
								<FieldLabel htmlFor="lst-price">Price</FieldLabel>
								<Input
									id="lst-price"
									inputMode="decimal"
									value={price}
									onChange={(e) => setPrice(e.target.value)}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="lst-city">City</FieldLabel>
								<Input id="lst-city" value={city} onChange={(e) => setCity(e.target.value)} />
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
								<SelectTrigger>
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
						<Button type="button" disabled={busy} onClick={() => void submitBasics()}>
							Continue
						</Button>
					</CardContent>
				</Card>
			) : null}

			{step === 2 && listingId ? (
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-base">Photos</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<ImageDropzone onFile={onUpload} disabled={busy} />
						<div className="flex flex-wrap gap-2">
							<Button type="button" variant="outline" onClick={() => setStep(3)} disabled={busy}>
								Skip for now
							</Button>
							<Button type="button" onClick={() => setStep(3)} disabled={busy}>
								Continue
							</Button>
						</div>
					</CardContent>
				</Card>
			) : null}

			{step === 3 && listingId ? (
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-base">Publish</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<p className="text-sm text-muted-foreground">
							Publish your listing to make it visible to buyers. You can edit it later from My Listings.
						</p>
						<Button type="button" disabled={busy} onClick={() => void onPublish()}>
							Publish listing
						</Button>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}
