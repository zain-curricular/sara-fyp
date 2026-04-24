// ============================================================================
// Shipping Settings Shell
// ============================================================================
//
// Form: flat fee, free shipping threshold, city-based rules toggle.
// Saves to seller_stores.metadata via PATCH /api/seller/store.

"use client";

import { useState } from "react";
import { Loader2, Truck } from "lucide-react";

import type { ShippingSettings } from "./page";
import { formatPKR } from "@/lib/utils/currency";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Field, FieldLabel } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import { Separator } from "@/components/primitives/separator";

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function ShippingSettingsShell({ settings }: { settings: ShippingSettings }) {
	const [flatFee, setFlatFee] = useState(settings.flatFee.toString());
	const [freeThreshold, setFreeThreshold] = useState(
		settings.freeThreshold?.toString() ?? "",
	);
	const [cityRules, setCityRules] = useState(settings.cityRulesEnabled);
	const [busy, setBusy] = useState(false);
	const [saved, setSaved] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	async function handleSave() {
		const fee = parseFloat(flatFee);
		if (isNaN(fee) || fee < 0) {
			setErrorMsg("Flat fee must be a positive number");
			return;
		}

		setErrorMsg(null);
		setSaved(false);
		setBusy(true);

		try {
			// Save to the store's metadata via a dedicated metadata endpoint
			// We patch seller_stores.metadata via PATCH /api/seller/store
			const res = await fetch("/api/seller/store", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					shippingSettings: {
						shipping_flat_fee: fee,
						shipping_free_threshold: freeThreshold ? parseFloat(freeThreshold) : null,
						shipping_city_rules: cityRules,
					},
				}),
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

	const preview = !isNaN(parseFloat(flatFee))
		? formatPKR(parseFloat(flatFee))
		: "—";

	const thresholdPreview =
		freeThreshold && !isNaN(parseFloat(freeThreshold))
			? formatPKR(parseFloat(freeThreshold))
			: null;

	return (
		<div container-id="shipping-settings-shell" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="shipping-header" className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<Truck className="size-5 text-muted-foreground" aria-hidden />
					<h1 className="text-3xl font-bold tracking-tight">Shipping settings</h1>
				</div>
				<p className="text-sm text-muted-foreground">
					Configure how shipping costs are calculated for your orders
				</p>
			</header>

			{errorMsg && (
				<p
					role="alert"
					className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
				>
					{errorMsg}
				</p>
			)}

			<Card size="sm">
				<CardHeader>
					<CardTitle className="text-base">Shipping rates</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-5">

					{/* Flat fee */}
					<Field>
						<FieldLabel htmlFor="flat-fee">Flat shipping fee (PKR)</FieldLabel>
						<Input
							id="flat-fee"
							inputMode="decimal"
							value={flatFee}
							onChange={(e) => setFlatFee(e.target.value)}
							placeholder="250"
						/>
						<p className="text-xs text-muted-foreground">
							Applied to all orders. Currently: <strong>{preview}</strong>
						</p>
					</Field>

					<Separator />

					{/* Free threshold */}
					<Field>
						<FieldLabel htmlFor="free-threshold">
							Free shipping threshold (PKR)
							<span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>
						</FieldLabel>
						<Input
							id="free-threshold"
							inputMode="decimal"
							value={freeThreshold}
							onChange={(e) => setFreeThreshold(e.target.value)}
							placeholder="e.g. 5000"
						/>
						{thresholdPreview && (
							<p className="text-xs text-muted-foreground">
								Orders above <strong>{thresholdPreview}</strong> get free shipping
							</p>
						)}
						{!thresholdPreview && (
							<p className="text-xs text-muted-foreground">
								Leave blank to always charge the flat fee
							</p>
						)}
					</Field>

					<Separator />

					{/* City rules toggle */}
					<label className="flex cursor-pointer items-start gap-3">
						<input
							type="checkbox"
							checked={cityRules}
							onChange={(e) => setCityRules(e.target.checked)}
							className="mt-0.5 accent-primary"
						/>
						<div className="flex flex-col gap-0.5">
							<span className="text-sm font-medium">City-based shipping rules</span>
							<span className="text-xs text-muted-foreground">
								Enable to set different rates for different cities (advanced). Rates must be configured
								manually in your store settings.
							</span>
						</div>
					</label>
				</CardContent>
			</Card>

			<div className="flex items-center justify-end gap-3">
				{saved && <span className="text-sm text-green-600">Saved successfully</span>}
				<Button type="button" disabled={busy} onClick={() => void handleSave()}>
					{busy ? (
						<>
							<Loader2 className="size-4 animate-spin" aria-hidden />
							Saving…
						</>
					) : (
						"Save settings"
					)}
				</Button>
			</div>
		</div>
	);
}
