// ============================================================================
// Seller Store Edit Shell
// ============================================================================
//
// Client shell for store management.
// Two tabs: Info (name, slug, city, description) and Logo & Banner.
// Slug field includes debounced uniqueness check via GET /api/seller/store/slug-check.
// Image fields upload to Supabase storage bucket 'store-assets' then save URL.
// Save button PATCHes /api/seller/store.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ImageIcon, Loader2, Store } from "lucide-react";

import type { SellerStore } from "@/lib/features/seller-store";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Field, FieldLabel } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import { Separator } from "@/components/primitives/separator";
import { Textarea } from "@/components/primitives/textarea";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Tab = "info" | "branding";

type StoreEditShellProps = {
	store: SellerStore | null;
	ownerId: string;
};

// ----------------------------------------------------------------------------
// Slug validation hook
// ----------------------------------------------------------------------------

function useSlugCheck(slug: string, originalSlug: string | undefined) {
	const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">(
		"idle",
	);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!slug || slug === originalSlug) {
			setStatus("idle");
			return;
		}

		if (!/^[a-z0-9-]{3,60}$/.test(slug)) {
			setStatus("invalid");
			return;
		}

		setStatus("checking");

		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(async () => {
			try {
				const res = await fetch(`/api/seller/store/slug-check?slug=${encodeURIComponent(slug)}`);
				const json = (await res.json()) as { ok: boolean; available?: boolean };
				setStatus(json.ok && json.available ? "available" : "taken");
			} catch {
				setStatus("idle");
			}
		}, 400);

		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [slug, originalSlug]);

	return status;
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function StoreEditShell({ store, ownerId }: StoreEditShellProps) {
	const [tab, setTab] = useState<Tab>("info");
	const [busy, setBusy] = useState(false);
	const [saved, setSaved] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	// Info fields
	const [storeName, setStoreName] = useState(store?.storeName ?? "");
	const [slug, setSlug] = useState(store?.slug ?? "");
	const [city, setCity] = useState(store?.city ?? "");
	const [description, setDescription] = useState(store?.description ?? "");

	// Branding fields
	const [logoUrl, setLogoUrl] = useState<string | null>(store?.logoUrl ?? null);
	const [bannerUrl, setBannerUrl] = useState<string | null>(store?.bannerUrl ?? null);
	const [uploadingLogo, setUploadingLogo] = useState(false);
	const [uploadingBanner, setUploadingBanner] = useState(false);

	const slugStatus = useSlugCheck(slug, store?.slug);

	// ----------------------------------------------------------------------------
	// Image upload
	// ----------------------------------------------------------------------------

	const uploadFile = useCallback(
		async (
			file: File,
			bucket: string,
			folder: string,
		): Promise<string | null> => {
			// Use the shared Supabase browser client
			const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
			const supabase = createBrowserSupabaseClient();

			const ext = file.name.split(".").pop() ?? "jpg";
			const path = `${folder}/${ownerId}/${Date.now()}.${ext}`;

			const { error } = await supabase.storage.from(bucket).upload(path, file, {
				upsert: true,
				contentType: file.type,
			});

			if (error) return null;

			const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
			return urlData.publicUrl;
		},
		[ownerId],
	);

	async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploadingLogo(true);
		try {
			const url = await uploadFile(file, "store-assets", "logos");
			if (url) setLogoUrl(url);
		} finally {
			setUploadingLogo(false);
		}
	}

	async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploadingBanner(true);
		try {
			const url = await uploadFile(file, "store-assets", "banners");
			if (url) setBannerUrl(url);
		} finally {
			setUploadingBanner(false);
		}
	}

	// ----------------------------------------------------------------------------
	// Save
	// ----------------------------------------------------------------------------

	async function handleSave() {
		setErrorMsg(null);
		setSaved(false);
		setBusy(true);

		try {
			const res = await fetch("/api/seller/store", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ storeName, city, description, logoUrl, bannerUrl }),
			});

			const json = (await res.json()) as { ok: boolean; error?: string };

			if (!json.ok) {
				setErrorMsg(json.error ?? "Failed to save");
			} else {
				setSaved(true);
				setTimeout(() => setSaved(false), 3000);
			}
		} catch {
			setErrorMsg("Network error — please try again");
		} finally {
			setBusy(false);
		}
	}

	// ----------------------------------------------------------------------------
	// Render
	// ----------------------------------------------------------------------------

	return (
		<div container-id="store-edit-shell" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="store-edit-header" className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<Store className="size-5 text-muted-foreground" aria-hidden />
						<h1 className="text-3xl font-bold tracking-tight">Your Store</h1>
					</div>
					<p className="text-sm text-muted-foreground">Manage your seller storefront</p>
				</div>
				{store?.slug && (
					<Link
						href={`/sellers/${store.slug}`}
						className="flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
					>
						<ArrowUpRight className="size-4" aria-hidden />
						View public page
					</Link>
				)}
			</header>

			{/* Tabs */}
			<div container-id="store-edit-tabs" className="flex gap-1 border-b border-border" role="tablist">
				{(["info", "branding"] as const).map((t) => (
					<button
						key={t}
						type="button"
						role="tab"
						aria-selected={tab === t}
						onClick={() => setTab(t)}
						className={cn(
							"border-b-2 px-4 pb-2 pt-1 text-sm font-medium transition-colors capitalize",
							tab === t
								? "border-primary text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground",
						)}
					>
						{t === "branding" ? "Logo & Banner" : "Info"}
					</button>
				))}
			</div>

			{/* Error */}
			{errorMsg && (
				<p
					role="alert"
					className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
				>
					{errorMsg}
				</p>
			)}

			{/* Tab: Info */}
			{tab === "info" && (
				<div container-id="store-info-form" className="flex flex-col gap-4">
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Store details</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<Field>
								<FieldLabel htmlFor="store-name">Store name</FieldLabel>
								<Input
									id="store-name"
									value={storeName}
									onChange={(e) => setStoreName(e.target.value)}
									placeholder="e.g. Auto Parts Hub"
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="store-slug">
									Store URL slug
									{slugStatus === "checking" && (
										<span className="ml-2 text-xs text-muted-foreground">Checking…</span>
									)}
									{slugStatus === "available" && (
										<Badge variant="secondary" className="ml-2 rounded-sm text-[10px] text-green-600">
											Available
										</Badge>
									)}
									{slugStatus === "taken" && (
										<Badge variant="secondary" className="ml-2 rounded-sm text-[10px] text-destructive">
											Taken
										</Badge>
									)}
									{slugStatus === "invalid" && (
										<span className="ml-2 text-xs text-destructive">Lowercase, numbers, hyphens only</span>
									)}
								</FieldLabel>
								<div className="flex items-center gap-1.5">
									<span className="text-sm text-muted-foreground shrink-0">/sellers/</span>
									<Input
										id="store-slug"
										value={slug}
										onChange={(e) => setSlug(e.target.value.toLowerCase())}
										placeholder="my-store"
									/>
								</div>
							</Field>

							<Field>
								<FieldLabel htmlFor="store-city">City</FieldLabel>
								<Input
									id="store-city"
									value={city}
									onChange={(e) => setCity(e.target.value)}
									placeholder="e.g. Karachi"
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="store-description">Description</FieldLabel>
								<Textarea
									id="store-description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Tell buyers about your store, specializations, return policy…"
									rows={4}
								/>
								<p className="text-xs text-muted-foreground">{description.length}/500</p>
							</Field>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Tab: Logo & Banner */}
			{tab === "branding" && (
				<div container-id="store-branding-form" className="flex flex-col gap-4">
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Store logo</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							{/* Logo preview */}
							<div className="flex items-center gap-4">
								<div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
									{logoUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={logoUrl} alt="Store logo" className="size-full object-cover" />
									) : (
										<ImageIcon className="size-7 text-muted-foreground/40" aria-hidden />
									)}
								</div>
								<div className="flex flex-col gap-2">
									<label
										htmlFor="logo-upload"
										className={cn(
											"flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium",
											"hover:border-foreground/30 hover:text-foreground",
											uploadingLogo && "cursor-not-allowed opacity-50",
										)}
									>
										{uploadingLogo && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
										{uploadingLogo ? "Uploading…" : "Upload logo"}
									</label>
									<input
										id="logo-upload"
										type="file"
										accept="image/*"
										className="sr-only"
										disabled={uploadingLogo}
										onChange={handleLogoUpload}
									/>
									<p className="text-xs text-muted-foreground">PNG or JPG, max 2MB</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Store banner</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							{/* Banner preview */}
							<div className="w-full overflow-hidden rounded-xl border border-border bg-muted/40" style={{ aspectRatio: "4/1" }}>
								{bannerUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={bannerUrl} alt="Store banner" className="size-full object-cover" />
								) : (
									<div className="flex size-full items-center justify-center">
										<ImageIcon className="size-8 text-muted-foreground/30" aria-hidden />
									</div>
								)}
							</div>
							<label
								htmlFor="banner-upload"
								className={cn(
									"flex w-fit cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium",
									"hover:border-foreground/30 hover:text-foreground",
									uploadingBanner && "cursor-not-allowed opacity-50",
								)}
							>
								{uploadingBanner && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
								{uploadingBanner ? "Uploading…" : "Upload banner"}
							</label>
							<input
								id="banner-upload"
								type="file"
								accept="image/*"
								className="sr-only"
								disabled={uploadingBanner}
								onChange={handleBannerUpload}
							/>
							<p className="text-xs text-muted-foreground">Recommended 1200×300 px, max 5MB</p>
						</CardContent>
					</Card>
				</div>
			)}

			<Separator />

			{/* Save */}
			<div className="flex items-center justify-end gap-3">
				{saved && (
					<span className="text-sm text-green-600">Saved successfully</span>
				)}
				<Button
					type="button"
					disabled={busy || slugStatus === "taken" || slugStatus === "invalid"}
					onClick={() => void handleSave()}
				>
					{busy ? (
						<>
							<Loader2 className="size-4 animate-spin" aria-hidden />
							Saving…
						</>
					) : (
						"Save changes"
					)}
				</Button>
			</div>
		</div>
	);
}
